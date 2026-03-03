import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { calculatorId } = await req.json()

        if (!calculatorId) {
            return NextResponse.json({ error: 'Calculator ID is required' }, { status: 400 })
        }

        // Upsert assignment for the retailer (1-to-1)
        // A retailer can only have one active calculator at a time
        // First delete any existing assignments
        await prisma.retailerCalculatorAssignment.deleteMany({
            where: { retailerId: params.id }
        })

        // Create new assignment
        const assignment = await prisma.retailerCalculatorAssignment.create({
            data: {
                retailerId: params.id,
                calculatorId: calculatorId,
                assignmentType: 'SYNCED', // Default
            }
        })

        return NextResponse.json(assignment)
    } catch (error) {
        console.error('Failed to assign calculator:', error)
        return NextResponse.json(
            { error: 'Failed to assign calculator' },
            { status: 500 }
        )
    }
}
