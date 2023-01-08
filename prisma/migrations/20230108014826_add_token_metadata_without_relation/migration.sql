-- CreateTable
CREATE TABLE "TokenMetadata" (
    "id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "ingredient" TEXT NOT NULL,
    "background" TEXT NOT NULL,

    CONSTRAINT "TokenMetadata_pkey" PRIMARY KEY ("id")
);
