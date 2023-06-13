-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'SCALAR_TRANSFER';
ALTER TYPE "EventType" ADD VALUE 'SCALAR_REMOVE';

-- CreateTable
CREATE TABLE "ScalarTransfer" (
    "transactionHash" TEXT NOT NULL,
    "eventIndex" INTEGER NOT NULL,
    "from" TEXT NOT NULL,

    CONSTRAINT "ScalarTransfer_pkey" PRIMARY KEY ("transactionHash","eventIndex")
);

-- CreateTable
CREATE TABLE "ScalarRemove" (
    "transactionHash" TEXT NOT NULL,
    "eventIndex" INTEGER NOT NULL,
    "from" INTEGER NOT NULL,

    CONSTRAINT "ScalarRemove_pkey" PRIMARY KEY ("transactionHash","eventIndex")
);

-- AddForeignKey
ALTER TABLE "ScalarTransfer" ADD CONSTRAINT "ScalarTransfer_transactionHash_eventIndex_fkey" FOREIGN KEY ("transactionHash", "eventIndex") REFERENCES "Event"("transactionHash", "eventIndex") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScalarRemove" ADD CONSTRAINT "ScalarRemove_transactionHash_eventIndex_fkey" FOREIGN KEY ("transactionHash", "eventIndex") REFERENCES "Event"("transactionHash", "eventIndex") ON DELETE RESTRICT ON UPDATE CASCADE;
