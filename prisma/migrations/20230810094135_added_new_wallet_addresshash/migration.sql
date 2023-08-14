/*
  Warnings:

  - A unique constraint covering the columns `[walletAddressHash]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `walletAddressHash` to the `accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "walletAddressHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "accounts_walletAddressHash_key" ON "accounts"("walletAddressHash");
