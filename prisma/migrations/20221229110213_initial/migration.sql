-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MINT', 'TRANSFER', 'CHANGE_ATTRIBUTE');

-- CreateTable
CREATE TABLE "metadata" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lastIndexed" INTEGER NOT NULL,
    "currentBlock" INTEGER NOT NULL,

    CONSTRAINT "metadata_pkey" PRIMARY KEY ("id"),
    CHECK ("id" = 1)
);

-- CreateTable
CREATE TABLE "Event" (
    "transactionHash" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "eventType" "EventType" NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("transactionHash")
);

-- CreateTable
CREATE TABLE "Mint" (
    "transactionHash" TEXT NOT NULL,
    "mintPrice" INTEGER NOT NULL,
    "background" TEXT NOT NULL,
    "ingredient" TEXT NOT NULL,

    CONSTRAINT "Mint_pkey" PRIMARY KEY ("transactionHash")
);

-- CreateTable
CREATE TABLE "ChangeAttribute" (
    "transactionHash" TEXT NOT NULL,
    "oldBackground" TEXT NOT NULL,
    "oldIngredient" TEXT NOT NULL,
    "newBackground" TEXT NOT NULL,
    "newIngredient" TEXT NOT NULL,

    CONSTRAINT "ChangeAttribute_pkey" PRIMARY KEY ("transactionHash")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "transactionHash" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("transactionHash")
);

-- AddForeignKey
ALTER TABLE "Mint" ADD CONSTRAINT "Mint_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES "Event"("transactionHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeAttribute" ADD CONSTRAINT "ChangeAttribute_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES "Event"("transactionHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES "Event"("transactionHash") ON DELETE RESTRICT ON UPDATE CASCADE;
