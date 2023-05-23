-- CreateTable
CREATE TABLE "TraitRedemption" (
    "L1_Address" TEXT NOT NULL,
    "L1_TokenId" INTEGER NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "to" TEXT NOT NULL,

    CONSTRAINT "TraitRedemption_pkey" PRIMARY KEY ("L1_Address","L1_TokenId")
);
