import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hash, compare } from 'bcryptjs'

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== 'RETAILER') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await req.json()
        const { currentPassword, newPassword, newEmail } = body

        if (!currentPassword) {
            return new NextResponse('Current password is required', { status: 400 })
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user) {
            return new NextResponse('User not found', { status: 404 })
        }

        // Verify current password
        const isPasswordValid = await compare(currentPassword, user.password)
        if (!isPasswordValid) {
            return new NextResponse('Invalid current password', { status: 400 })
        }

        const updateData: any = {}

        // Update password if provided
        if (newPassword) {
            if (newPassword.length < 8) {
                return new NextResponse('New password must be at least 8 characters long', { status: 400 })
            }
            const hashedPassword = await hash(newPassword, 12)
            updateData.password = hashedPassword
        }

        // Update email if provided
        if (newEmail && newEmail !== user.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email: newEmail }
            })
            if (existingUser) {
                return new NextResponse('Email is already in use', { status: 400 })
            }
            updateData.email = newEmail
        }

        if (Object.keys(updateData).length === 0) {
            return new NextResponse('No valid fields to update', { status: 400 })
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: updateData
        })

        return NextResponse.json({ success: true, email: updateData.email || user.email })
    } catch (error) {
        console.error('Error updating security settings:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
