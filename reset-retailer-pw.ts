import { PrismaClient } from '@cushion-saas/database'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await hash('retailer123', 10)
    await prisma.user.update({
        where: { email: 'admin1@test.com' },
        data: { password: hashedPassword }
    })
    console.log(`Reset password for admin1@test.com to retailer123`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
