import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json()

        if (!token || !password) {
            return NextResponse.json({ error: 'Missing token or password' }, { status: 400 })
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
        }

        // Find the pending user account with the invitation token
        const user = await prisma.user.findFirst({
            where: {
                invitationToken: token,
                status: 'PENDING',
                invitationExpires: {
                    gte: new Date() // check if it hasn't expired
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired invitation token' }, { status: 400 })
        }

        // Hash the new permanently chosen password
        const hashedPassword = await hash(password, 10)

        // Update user to active state
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                status: 'ACTIVE',
                invitationToken: null,
                invitationExpires: null
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to accept invitation:', error)
        return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
    }
}
