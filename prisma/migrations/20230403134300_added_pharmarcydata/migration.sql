-- CreateTable
CREATE TABLE "PharmacyData" (
    "typeIndex" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,
    "startAmount" INTEGER NOT NULL,
    "amount_left" INTEGER NOT NULL,

    CONSTRAINT "PharmacyData_pkey" PRIMARY KEY ("typeIndex","index")
);
