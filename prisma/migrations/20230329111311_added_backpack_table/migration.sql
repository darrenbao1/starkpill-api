-- CreateTable
CREATE TABLE "BackpackMetadata" (
    "id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isIngredient" BOOLEAN NOT NULL,
    "itemName" TEXT NOT NULL,

    CONSTRAINT "BackpackMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backpack" (
    "id" INTEGER NOT NULL,
    "ownerAddress" TEXT NOT NULL,

    CONSTRAINT "Backpack_pkey" PRIMARY KEY ("id")
);
