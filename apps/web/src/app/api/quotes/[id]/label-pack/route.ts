import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import JSZip from 'jszip'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const quote = await prisma.quote.findUnique({
            where: { id: params.id },
            include: {
                retailer: {
                    select: {
                        businessName: true,
                        labelFileUrl: true,
                        labelTitle: true,
                        labelPreference: true,
                    }
                }
            }
        })

        if (!quote) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
        }

        // Access control
        if (session.user.role === 'RETAILER' && quote.retailerId !== session.user.retailerId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const retailer = quote.retailer

        // Check label setup
        const labelPref = quote.labelPreference ?? retailer?.labelPreference
        if (labelPref !== 'ALWAYS' && labelPref !== 'PER_ORDER') {
            return NextResponse.json({ error: 'This retailer does not have a label setup.' }, { status: 400 })
        }

        if (!retailer?.labelFileUrl) {
            return NextResponse.json({ error: 'No label image uploaded. Please upload a label image in settings.' }, { status: 400 })
        }

        const labelTitle = retailer?.labelTitle || retailer?.businessName || 'Label'

        // Build zip
        const zip = new JSZip()

        // Add label image
        let imageBytes: Uint8Array
        let imageExt = 'jpg'

        if (retailer.labelFileUrl.startsWith('data:')) {
            // Base64 data URL
            const matches = retailer.labelFileUrl.match(/^data:image\/(\w+);base64,(.+)$/)
            if (!matches) {
                return NextResponse.json({ error: 'Invalid label image format' }, { status: 400 })
            }
            imageExt = matches[1] === 'jpeg' ? 'jpg' : matches[1]
            const raw = atob(matches[2])
            const arr = new Uint8Array(raw.length)
            for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
            imageBytes = arr
        } else {
            // Remote URL — fetch it
            const imgRes = await fetch(retailer.labelFileUrl)
            if (!imgRes.ok) {
                return NextResponse.json({ error: 'Failed to fetch label image' }, { status: 500 })
            }
            const contentType = imgRes.headers.get('content-type') || ''
            if (contentType.includes('png')) imageExt = 'png'
            else if (contentType.includes('webp')) imageExt = 'webp'
            imageBytes = new Uint8Array(await imgRes.arrayBuffer())
        }

        zip.file(`${quote.quoteNumber}-label.${imageExt}`, imageBytes)

        // Add notepad (txt) with label title and quote info
        const notepadContent = [
            `==============================`,
            `LABEL INFORMATION`,
            `==============================`,
            `Quote ID   : ${quote.quoteNumber}`,
            `Label Title: ${labelTitle}`,
            `Customer   : ${quote.customerName}`,
            `Date       : ${new Date(quote.createdAt).toLocaleDateString()}`,
            `==============================`,
            ``,
            `This label should be stitched on the cushion(s) for the above order.`,
            ``,
            `Retailer   : ${retailer.businessName}`,
        ].join('\n')

        zip.file(`${quote.quoteNumber}-label-info.txt`, notepadContent)

        const zipData = await zip.generateAsync({ type: 'uint8array' })
        const buffer = zipData.buffer

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${quote.quoteNumber}-label-pack.zip"`,
            }
        })

    } catch (error) {
        console.error('Label pack generation error:', error)
        return NextResponse.json({ error: 'Failed to generate label pack' }, { status: 500 })
    }
}
