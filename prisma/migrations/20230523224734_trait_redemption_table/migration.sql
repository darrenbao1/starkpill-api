-- CreateTable
CREATE TABLE "TraitRedemption" (
    "l1_address" TEXT NOT NULL,
    "l1_tokenId" INTEGER NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "to" TEXT NOT NULL,

    CONSTRAINT "TraitRedemption_pkey" PRIMARY KEY ("l1_address","l1_tokenId")
);
