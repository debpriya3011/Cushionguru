import { PrismaClient, Role, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      email: "admin@test.com",
      firstName: "Admin",
      lastName: "User",
      password: "admin123",
      role: UserRole.SUPER_ADMIN,   // ✅ REQUIRED
    },
  });

  console.log("Created user:", user);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });