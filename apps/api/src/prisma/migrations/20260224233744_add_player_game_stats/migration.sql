-- CreateEnum
CREATE TYPE "GameStatsStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISPUTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "StatDisputeStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "MatchPlayerGameStats" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "isSubstitute" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "shots" INTEGER NOT NULL DEFAULT 0,
    "shotAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passes" INTEGER NOT NULL DEFAULT 0,
    "passAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dribbles" INTEGER NOT NULL DEFAULT 0,
    "dribbleSuccessRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tackles" INTEGER NOT NULL DEFAULT 0,
    "tackleSuccessRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "offsides" INTEGER NOT NULL DEFAULT 0,
    "foulsCommitted" INTEGER NOT NULL DEFAULT 0,
    "possessionsWon" INTEGER NOT NULL DEFAULT 0,
    "possessionsLost" INTEGER NOT NULL DEFAULT 0,
    "minutesPlayed" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "shotsAgainst" INTEGER,
    "shotsOnTarget" INTEGER,
    "saves" INTEGER,
    "goalsConceded" INTEGER,
    "saveSuccessRate" DOUBLE PRECISION,
    "cleanSheet" BOOLEAN,
    "status" "GameStatsStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchPlayerGameStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatDispute" (
    "id" TEXT NOT NULL,
    "gameStatsId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "disputedById" TEXT NOT NULL,
    "reason" TEXT,
    "status" "StatDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedById" TEXT,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatDelegate" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "delegateUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatDelegate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchPlayerGameStats_matchId_idx" ON "MatchPlayerGameStats"("matchId");

-- CreateIndex
CREATE INDEX "MatchPlayerGameStats_playerId_idx" ON "MatchPlayerGameStats"("playerId");

-- CreateIndex
CREATE INDEX "MatchPlayerGameStats_teamId_idx" ON "MatchPlayerGameStats"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchPlayerGameStats_matchId_playerId_key" ON "MatchPlayerGameStats"("matchId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "StatDelegate_teamId_delegateUserId_key" ON "StatDelegate"("teamId", "delegateUserId");

-- AddForeignKey
ALTER TABLE "MatchPlayerGameStats" ADD CONSTRAINT "MatchPlayerGameStats_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayerGameStats" ADD CONSTRAINT "MatchPlayerGameStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayerGameStats" ADD CONSTRAINT "MatchPlayerGameStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayerGameStats" ADD CONSTRAINT "MatchPlayerGameStats_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatDispute" ADD CONSTRAINT "StatDispute_gameStatsId_fkey" FOREIGN KEY ("gameStatsId") REFERENCES "MatchPlayerGameStats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatDispute" ADD CONSTRAINT "StatDispute_disputedById_fkey" FOREIGN KEY ("disputedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatDispute" ADD CONSTRAINT "StatDispute_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatDelegate" ADD CONSTRAINT "StatDelegate_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatDelegate" ADD CONSTRAINT "StatDelegate_delegateUserId_fkey" FOREIGN KEY ("delegateUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
