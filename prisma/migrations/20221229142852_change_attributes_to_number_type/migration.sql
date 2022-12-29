/*
  Warnings:

  - Changed the type of `oldBackground` on the `ChangeAttribute` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `oldIngredient` on the `ChangeAttribute` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `newBackground` on the `ChangeAttribute` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `newIngredient` on the `ChangeAttribute` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `background` on the `Mint` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ingredient` on the `Mint` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ChangeAttribute" DROP COLUMN "oldBackground",
ADD COLUMN     "oldBackground" INTEGER NOT NULL,
DROP COLUMN "oldIngredient",
ADD COLUMN     "oldIngredient" INTEGER NOT NULL,
DROP COLUMN "newBackground",
ADD COLUMN     "newBackground" INTEGER NOT NULL,
DROP COLUMN "newIngredient",
ADD COLUMN     "newIngredient" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Mint" DROP COLUMN "background",
ADD COLUMN     "background" INTEGER NOT NULL,
DROP COLUMN "ingredient",
ADD COLUMN     "ingredient" INTEGER NOT NULL;
