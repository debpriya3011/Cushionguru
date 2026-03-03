import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected!')

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        password: false, // Don't show password
      },
    })

    console.log(`Found ${users.length} users:`)
    users.forEach(u => console.log(`- ${u.email} (${u.role}, ${u.status})`))

    if (users.length === 0) {
      console.log('\n⚠️ No users found. You need to create one.')
    }
  } catch (error) {
    console.error('❌ Database error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()