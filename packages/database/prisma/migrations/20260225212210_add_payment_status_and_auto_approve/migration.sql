-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "paymentDate" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "stripePaymentId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "autoApproveQuotes" BOOLEAN NOT NULL DEFAULT false;
