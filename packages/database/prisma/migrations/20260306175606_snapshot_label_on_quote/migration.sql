/*
  Warnings:

  - You are about to drop the column `labelFileUrl` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `labelTitle` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "labelFileUrl",
DROP COLUMN "labelTitle";
