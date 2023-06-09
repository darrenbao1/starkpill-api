/*
  Warnings:

  - You are about to drop the column `incrementBy` on the `Defame` table. All the data in the column will be lost.
  - You are about to drop the column `incrementBy` on the `Fame` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Defame" DROP COLUMN "incrementBy";

-- AlterTable
ALTER TABLE "Fame" DROP COLUMN "incrementBy";
