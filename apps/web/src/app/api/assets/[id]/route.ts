import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromS3 } from '@/lib/s3'

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const asset = await prisma.asset.findUnique({
            where: { id: params.id }
        })

        if (!asset) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
        }

        // Delete the file from S3
        if (asset.url && typeof asset.url === 'string' && asset.url.trim() !== '') {
            try {
                await deleteFromS3(asset.url);
            } catch (err) {
                console.warn('Could not delete file from S3:', err)
            }
        }

        await prisma.asset.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete asset:', error)
        return NextResponse.json(
            { error: 'Failed to delete asset' },
            { status: 500 }
        )
    }
}
