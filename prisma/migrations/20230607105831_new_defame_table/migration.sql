-- CreateTable
CREATE TABLE "Defame" (
    "transactionHash" TEXT NOT NULL,
    "eventIndex" INTEGER NOT NULL,
    "voter" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "Defame_pkey" PRIMARY KEY ("transactionHash","eventIndex")
);

-- AddForeignKey
ALTER TABLE "Defame" ADD CONSTRAINT "Defame_transactionHash_eventIndex_fkey" FOREIGN KEY ("transactionHash", "eventIndex") REFERENCES "Event"("transactionHash", "eventIndex") ON DELETE RESTRICT ON UPDATE CASCADE;
