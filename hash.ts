import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany()
    for (const user of users) {
        if (!user.password.startsWith('$2a$')) {
            const hashedPassword = await hash(user.password, 10)
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            })
            console.log(`Updated password for ${user.email}`)
        } else {
            console.log(`Password already hashed for ${user.email}`)
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())
