-- AlterTable
ALTER TABLE "users" ADD COLUMN     "plan" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");
