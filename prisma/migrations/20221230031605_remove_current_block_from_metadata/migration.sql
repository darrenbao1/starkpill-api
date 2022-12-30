/*
  Warnings:

  - You are about to drop the column `currentBlock` on the `metadata` table. All the data in the column will be lost.
  - You are about to drop the column `lastIndexed` on the `metadata` table. All the data in the column will be lost.
  - Added the required column `lastIndexedBlock` to the `metadata` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "metadata" DROP COLUMN "currentBlock",
DROP COLUMN "lastIndexed",
ADD COLUMN     "lastIndexedBlock" INTEGER NOT NULL;
