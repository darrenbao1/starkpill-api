-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MINT', 'TRANSFER', 'CHANGE_ATTRIBUTE');

-- CreateTable
CREATE TABLE "Event" (
    "transactionHash" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "eventType" "EventType" NOT NULL,
    "mintPrice" INTEGER,
    "background" TEXT,
    "ingredient" TEXT,
    "from" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("transactionHash"),
    CHECK ("eventType" = 'MINT' AND "mintPrice" IS NOT NULL AND "background" IS NOT NULL AND "ingredient" IS NOT NULL AND "from" IS NULL OR "eventType" = 'TRANSFER' AND "mintPrice" IS NULL AND "background" IS NULL AND "ingredient" IS NULL AND "from" IS NOT NULL OR "eventType" = 'CHANGE_ATTRIBUTE' AND "mintPrice" IS NULL AND "background" IS NOT NULL AND "ingredient" IS NOT NULL AND "from" IS NULL)
);

-- CreateTable
CREATE TABLE "metadata" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lastIndexed" INTEGER NOT NULL,
    "currentBlock" INTEGER NOT NULL,

    CONSTRAINT "metadata_pkey" PRIMARY KEY ("id"),
    CHECK ("id" = 1)
);
