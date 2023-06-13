-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'FAME';
ALTER TYPE "EventType" ADD VALUE 'DEFAME';

-- CreateTable
CREATE TABLE "Fame" (
    "transactionHash" TEXT NOT NULL,
    "eventIndex" INTEGER NOT NULL,
    "voter" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "Fame_pkey" PRIMARY KEY ("transactionHash","eventIndex")
);

-- AddForeignKey
ALTER TABLE "Fame" ADD CONSTRAINT "Fame_transactionHash_eventIndex_fkey" FOREIGN KEY ("transactionHash", "eventIndex") REFERENCES "Event"("transactionHash", "eventIndex") ON DELETE RESTRICT ON UPDATE CASCADE;
