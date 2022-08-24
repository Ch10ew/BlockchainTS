/*
  Warnings:

  - Changed the type of `publicKey` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `privateKey` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "publicKey",
ADD COLUMN     "publicKey" BYTEA NOT NULL,
DROP COLUMN "privateKey",
ADD COLUMN     "privateKey" BYTEA NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_publicKey_key" ON "User"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_privateKey_key" ON "User"("privateKey");
