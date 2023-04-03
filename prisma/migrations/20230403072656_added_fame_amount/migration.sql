/*
  Warnings:

  - Added the required column `defame` to the `TokenMetadata` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fame` to the `TokenMetadata` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TokenMetadata" ADD COLUMN     "defame" INTEGER NOT NULL,
ADD COLUMN     "fame" INTEGER NOT NULL;
