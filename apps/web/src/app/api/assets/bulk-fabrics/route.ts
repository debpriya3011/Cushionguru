import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import path from 'path'
import { uploadToS3, getS3BaseUrl } from '@/lib/s3'

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const category = formData.get('fabricCategory') as string
        const csvFile = formData.get('csvFile') as File

        if (!csvFile) {
            return NextResponse.json({ error: 'MissingCSV' }, { status: 400 })
        }

        const csvText = await csvFile.text()
        const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0)

        const records = []

        // Check if the first row is a header
        let startIdx = 0
        if (lines[0].toLowerCase().includes('id') || lines[0].toLowerCase().includes('price')) {
            startIdx = 1
        }

        for (let i = startIdx; i < lines.length; i++) {
            const line = lines[i]
            const [id, label, priceStr] = line.split(',').map(s => s.trim())
            if (id && label) {
                records.push({ id, label, price: parseFloat(priceStr) || 0 })
            }
        }

        const imageFiles = formData.getAll('images') as File[]

        // Get the master calculator to attach the fabrics to
        const masterCalc = await prisma.calculator.findFirst({ where: { isMaster: true } })
        if (!masterCalc) {
            return NextResponse.json({ error: 'NoMasterCalculatorFound' }, { status: 400 })
        }

        let brand = await prisma.fabricBrand.findFirst({
            where: { name: `Bulk Import - ${category}`, calculatorId: masterCalc.id }
        })

        if (!brand) {
            brand = await prisma.fabricBrand.create({
                data: {
                    name: `Bulk Import - ${category}`,
                    description: `Bulk configured ${category} fabrics`,
                    calculatorId: masterCalc.id,
                }
            })
        }

        const uploadedImagesMap = new Map<string, string>();

        for (const img of imageFiles) {
            try {
                const safeName = path.basename(img.name)
                const bytes = await img.arrayBuffer()
                const buffer = Buffer.from(bytes)

                const timestampedName = `fabrics/${Date.now()}-${safeName}`;
                const fileUrl = await uploadToS3(timestampedName, buffer, img.type || 'image/jpeg');

                uploadedImagesMap.set(img.name, fileUrl);

                await prisma.asset.create({
                    data: {
                        filename: safeName,
                        originalName: img.name,
                        mimeType: img.type || 'image/jpeg',
                        size: img.size || 0,
                        url: fileUrl,
                        category: 'FABRIC_IMAGE',
                        tags: [category.toLowerCase(), 'bulk-upload'],
                        uploadedById: session.user.id
                    }
                })
            } catch (e) { /* ignore duplicated asset inserts */ }
        }

        for (const record of records) {
            const match = imageFiles.find(f => f.name.includes(record.id))
            let imgUrl = `${getS3BaseUrl()}/fabrics/default.jpg`;

            if (match && uploadedImagesMap.has(match.name)) {
                imgUrl = uploadedImagesMap.get(match.name)!;
            }

            let tier: any = 'TIER_1'
            if (record.price > 70) tier = 'TIER_6'
            else if (record.price > 35) tier = 'TIER_5'
            else if (record.price > 30) tier = 'TIER_4'
            else if (record.price > 25) tier = 'TIER_3'
            else if (record.price > 23) tier = 'TIER_2'

            // Upsert fabric if code exists, create if not
            const existingFabric = await prisma.fabric.findFirst({
                where: { code: record.id, brandId: brand.id }
            })

            if (!existingFabric) {
                await prisma.fabric.create({
                    data: {
                        name: record.label,
                        code: record.id,
                        description: `Category: ${category}`,
                        imageUrl: imgUrl,
                        priceTier: tier,
                        price: record.price,
                        brandId: brand.id
                    }
                })
            } else {
                await prisma.fabric.update({
                    where: { id: existingFabric.id },
                    data: {
                        name: record.label,
                        priceTier: tier,
                        price: record.price,
                        imageUrl: imgUrl
                    }
                })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to import bulk fabrics:', error)
        return NextResponse.json({ error: 'BulkImportFailed' }, { status: 500 })
    }
}
