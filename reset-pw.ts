import { PrismaClient } from '@cushion-saas/database'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await hash('admin123', 10)
    await prisma.user.update({
        where: { email: 'admin@test.com' },
        data: { password: hashedPassword }
    })
    console.log(`Reset password for admin@test.com to admin123`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
