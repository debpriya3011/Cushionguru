import { PrismaClient } from '@prisma/client';

export { PrismaClient };
export const prisma = new PrismaClient();

export const testDatabase = () => {
  console.log("Database package working 🚀")
}