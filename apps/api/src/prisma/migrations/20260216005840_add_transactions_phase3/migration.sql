-- CreateEnum
CREATE TYPE "TradeOfferStatus" AS ENUM ('PENDING', 'PENDING_APPROVAL', 'REJECTED', 'COUNTERED', 'APPROVED', 'DENIED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WaiverStatus" AS ENUM ('ACTIVE', 'CLAIMED', 'CLEARED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('TRADE', 'FREE_AGENCY', 'WAIVER_CLAIM', 'RELEASED', 'WAIVER_CLEAR', 'ADMIN_ASSIGN', 'ADMIN_RELEASE');

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "budget" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "LeagueSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeOffer" (
    "id" TEXT NOT NULL,
    "initiatingTeamId" TEXT NOT NULL,
    "receivingTeamId" TEXT NOT NULL,
    "currencyOffered" INTEGER NOT NULL DEFAULT 0,
    "currencyRequested" INTEGER NOT NULL DEFAULT 0,
    "status" "TradeOfferStatus" NOT NULL DEFAULT 'PENDING',
    "parentOfferId" TEXT,
    "note" TEXT,
    "responseNote" TEXT,
    "adminNote" TEXT,
    "expiresAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeOfferPlayer" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "offeredInId" TEXT,
    "requestedInId" TEXT,

    CONSTRAINT "TradeOfferPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaiverWire" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "releasedFromId" TEXT,
    "status" "WaiverStatus" NOT NULL DEFAULT 'ACTIVE',
    "waiverPeriodDays" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "winningBidId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaiverWire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaiverBid" (
    "id" TEXT NOT NULL,
    "waiverWireId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaiverBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "playerId" TEXT NOT NULL,
    "fromTeamId" TEXT,
    "toTeamId" TEXT,
    "currencyAmount" INTEGER,
    "tradeOfferId" TEXT,
    "waiverWireId" TEXT,
    "note" TEXT,
    "executedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeagueSetting_key_key" ON "LeagueSetting"("key");

-- CreateIndex
CREATE INDEX "TradeOffer_status_idx" ON "TradeOffer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TradeOfferPlayer_playerId_offeredInId_key" ON "TradeOfferPlayer"("playerId", "offeredInId");

-- CreateIndex
CREATE UNIQUE INDEX "TradeOfferPlayer_playerId_requestedInId_key" ON "TradeOfferPlayer"("playerId", "requestedInId");

-- CreateIndex
CREATE UNIQUE INDEX "WaiverWire_winningBidId_key" ON "WaiverWire"("winningBidId");

-- CreateIndex
CREATE UNIQUE INDEX "WaiverBid_waiverWireId_teamId_key" ON "WaiverBid"("waiverWireId", "teamId");

-- AddForeignKey
ALTER TABLE "TradeOffer" ADD CONSTRAINT "TradeOffer_parentOfferId_fkey" FOREIGN KEY ("parentOfferId") REFERENCES "TradeOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeOffer" ADD CONSTRAINT "TradeOffer_initiatingTeamId_fkey" FOREIGN KEY ("initiatingTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeOffer" ADD CONSTRAINT "TradeOffer_receivingTeamId_fkey" FOREIGN KEY ("receivingTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeOffer" ADD CONSTRAINT "TradeOffer_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeOfferPlayer" ADD CONSTRAINT "TradeOfferPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeOfferPlayer" ADD CONSTRAINT "TradeOfferPlayer_offeredInId_fkey" FOREIGN KEY ("offeredInId") REFERENCES "TradeOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeOfferPlayer" ADD CONSTRAINT "TradeOfferPlayer_requestedInId_fkey" FOREIGN KEY ("requestedInId") REFERENCES "TradeOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiverWire" ADD CONSTRAINT "WaiverWire_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiverWire" ADD CONSTRAINT "WaiverWire_releasedFromId_fkey" FOREIGN KEY ("releasedFromId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiverWire" ADD CONSTRAINT "WaiverWire_winningBidId_fkey" FOREIGN KEY ("winningBidId") REFERENCES "WaiverBid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiverBid" ADD CONSTRAINT "WaiverBid_waiverWireId_fkey" FOREIGN KEY ("waiverWireId") REFERENCES "WaiverWire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiverBid" ADD CONSTRAINT "WaiverBid_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fromTeamId_fkey" FOREIGN KEY ("fromTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_toTeamId_fkey" FOREIGN KEY ("toTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tradeOfferId_fkey" FOREIGN KEY ("tradeOfferId") REFERENCES "TradeOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_waiverWireId_fkey" FOREIGN KEY ("waiverWireId") REFERENCES "WaiverWire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
