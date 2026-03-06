-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "labelFileUrl" TEXT,
ADD COLUMN     "labelTitle" TEXT;

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "labelFileUrl" TEXT,
ADD COLUMN     "labelTitle" TEXT;
