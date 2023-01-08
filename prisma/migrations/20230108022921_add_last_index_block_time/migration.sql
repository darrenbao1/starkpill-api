/*
  Warnings:

  - Added the required column `mintPrice` to the `TokenMetadata` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TokenMetadata" ADD COLUMN     "mintPrice" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "metadata" ADD COLUMN     "lastIndexedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
