/*
  Warnings:

  - You are about to drop the column `stripePaymentId` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `autoApproveQuotes` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AssetCategory" ADD VALUE 'ZIPPER_IMAGE';
ALTER TYPE "AssetCategory" ADD VALUE 'PIPING_IMAGE';
ALTER TYPE "AssetCategory" ADD VALUE 'TIES_IMAGE';

-- DropIndex
DROP INDEX "users_stripeCustomerId_key";

-- AlterTable
ALTER TABLE "quotes" DROP COLUMN "stripePaymentId",
ADD COLUMN     "stripePaymentIntentId" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "autoApproveQuotes",
DROP COLUMN "plan",
DROP COLUMN "stripeCustomerId";

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");
