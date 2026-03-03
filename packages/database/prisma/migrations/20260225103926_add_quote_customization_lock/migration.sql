-- CreateEnum
CREATE TYPE "BrandPreference" AS ENUM ('ALWAYS', 'PER_ORDER', 'NONE');

-- CreateEnum
CREATE TYPE "ShippingPreference" AS ENUM ('SHIP_TO_RETAILER', 'DROP_SHIP');

-- AlterTable
ALTER TABLE "fabrics" ADD COLUMN     "price" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "labelPreference" "BrandPreference",
ADD COLUMN     "pdfPreference" "BrandPreference",
ADD COLUMN     "shippingPreference" "ShippingPreference";

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "isCustomized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "labelPreference" "BrandPreference",
ADD COLUMN     "pdfPreference" "BrandPreference",
ADD COLUMN     "shippingPreference" "ShippingPreference";

-- AlterTable
ALTER TABLE "retailers" ADD COLUMN     "labelCost" DECIMAL(10,2) DEFAULT 8.00,
ADD COLUMN     "labelFileUrl" TEXT,
ADD COLUMN     "labelPlacement" TEXT,
ADD COLUMN     "labelPreference" "BrandPreference" DEFAULT 'NONE',
ADD COLUMN     "labelStyle" TEXT,
ADD COLUMN     "pdfCost" DECIMAL(10,2) DEFAULT 10.00,
ADD COLUMN     "pdfCustomization" JSONB,
ADD COLUMN     "pdfPreference" "BrandPreference" DEFAULT 'NONE',
ADD COLUMN     "shippingPreference" "ShippingPreference" DEFAULT 'SHIP_TO_RETAILER';

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
