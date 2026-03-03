import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import path from 'path'
import { uploadToS3 } from '@/lib/s3'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const category = searchParams.get('category')

        const where: any = {}
        if (category && category !== 'all') {
            where.category = category
        }

        const assets = await prisma.asset.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(assets)
    } catch (error) {
        console.error('Failed to fetch assets:', error)
        return NextResponse.json(
            { error: 'Failed to fetch assets' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const formData = await req.formData()

        // Simulate File Uploading
        const file = formData.get('file') as any
        const category = formData.get('category') as any
        const tagsStr = formData.get('tags') as string

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Ensure filename is safe
        const safeName = path.basename(file.name)
        const tags = tagsStr ? tagsStr.split(',').map((t: string) => t.trim()) : []

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const timestampedName = `${Date.now()}-${safeName}`;
        const url = await uploadToS3(timestampedName, buffer, file.type || 'application/octet-stream');

        const asset = await prisma.asset.create({
            data: {
                filename: safeName,
                originalName: file.name,
                mimeType: file.type || 'application/octet-stream',
                size: file.size || 0,
                url,
                category: category || 'OTHER',
                tags,
                uploadedById: session.user.id
            }
        })

        return NextResponse.json(asset, { status: 201 })
    } catch (error) {
        console.error('Failed to upload asset:', error)
        return NextResponse.json(
            { error: 'Failed to upload asset' },
            { status: 500 }
        )
    }
}
