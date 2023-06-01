/*
  Warnings:

  - The primary key for the `ChangeAttribute` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Event` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Mint` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Transfer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `eventIndex` to the `ChangeAttribute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventIndex` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventIndex` to the `Mint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventIndex` to the `Transfer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChangeAttribute" DROP CONSTRAINT "ChangeAttribute_transactionHash_fkey";

-- DropForeignKey
ALTER TABLE "Mint" DROP CONSTRAINT "Mint_transactionHash_fkey";

-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_transactionHash_fkey";

-- AlterTable
ALTER TABLE "ChangeAttribute" DROP CONSTRAINT "ChangeAttribute_pkey",
ADD COLUMN     "eventIndex" INTEGER NOT NULL,
ADD CONSTRAINT "ChangeAttribute_pkey" PRIMARY KEY ("transactionHash", "eventIndex");

-- AlterTable
ALTER TABLE "Event" DROP CONSTRAINT "Event_pkey",
ADD COLUMN     "eventIndex" INTEGER NOT NULL,
ADD CONSTRAINT "Event_pkey" PRIMARY KEY ("transactionHash", "eventIndex");

-- AlterTable
ALTER TABLE "Mint" DROP CONSTRAINT "Mint_pkey",
ADD COLUMN     "eventIndex" INTEGER NOT NULL,
ADD CONSTRAINT "Mint_pkey" PRIMARY KEY ("transactionHash", "eventIndex");

-- AlterTable
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_pkey",
ADD COLUMN     "eventIndex" INTEGER NOT NULL,
ADD CONSTRAINT "Transfer_pkey" PRIMARY KEY ("transactionHash", "eventIndex");

-- AddForeignKey
ALTER TABLE "Mint" ADD CONSTRAINT "Mint_transactionHash_eventIndex_fkey" FOREIGN KEY ("transactionHash", "eventIndex") REFERENCES "Event"("transactionHash", "eventIndex") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeAttribute" ADD CONSTRAINT "ChangeAttribute_transactionHash_eventIndex_fkey" FOREIGN KEY ("transactionHash", "eventIndex") REFERENCES "Event"("transactionHash", "eventIndex") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_transactionHash_eventIndex_fkey" FOREIGN KEY ("transactionHash", "eventIndex") REFERENCES "Event"("transactionHash", "eventIndex") ON DELETE RESTRICT ON UPDATE CASCADE;
