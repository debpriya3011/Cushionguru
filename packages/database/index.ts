import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const testDatabase = () => {
  console.log("Database package working 🚀")
}