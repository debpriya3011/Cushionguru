import { PrismaClient } from '@cushion-saas/database'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Optimized Prisma client with connection pool tuned for 30+ concurrent users.
// connection_limit: max DB connections held open per Node process
// pool_timeout:    how long (s) to wait for a free connection before erroring
// connect_timeout: max time (s) to open a new DB connection
function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
