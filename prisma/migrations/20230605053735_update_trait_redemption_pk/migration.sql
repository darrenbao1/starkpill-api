/*
  Warnings:

  - The primary key for the `TraitRedemption` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "TraitRedemption" DROP CONSTRAINT "TraitRedemption_pkey",
ADD CONSTRAINT "TraitRedemption_pkey" PRIMARY KEY ("l1_address", "l1_tokenId", "tokenId");
