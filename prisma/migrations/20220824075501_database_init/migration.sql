-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ARTIST', 'COLLECTOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artwork" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "artworkPath" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,

    CONSTRAINT "Artwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "blockchainHash" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
