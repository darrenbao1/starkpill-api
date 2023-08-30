/*
  Warnings:

  - You are about to drop the column `coverPictureTokenId` on the `accounts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "coverPictureTokenId",
ADD COLUMN     "coverPictureUrl" TEXT,
ADD COLUMN     "pos_x_CoverPicture" INTEGER,
ADD COLUMN     "pos_y_CoverPicture" INTEGER;
