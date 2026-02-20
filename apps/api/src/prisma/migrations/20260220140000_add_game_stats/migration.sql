-- CreateEnum
CREATE TYPE "MatchStatType" AS ENUM ('GOAL', 'ASSIST', 'TACKLE', 'SAVE');

-- CreateTable
CREATE TABLE "MatchLineupEntry" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "isStarter" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MatchLineupEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchSubstitution" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerInId" TEXT NOT NULL,
    "playerOutId" TEXT NOT NULL,
    "minute" INTEGER NOT NULL,

    CONSTRAINT "MatchSubstitution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchPlayerStat" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "statType" "MatchStatType" NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1,
    "minute" INTEGER,

    CONSTRAINT "MatchPlayerStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchLineupEntry_matchId_teamId_playerId_key" ON "MatchLineupEntry"("matchId", "teamId", "playerId");

-- CreateIndex
CREATE INDEX "MatchSubstitution_matchId_idx" ON "MatchSubstitution"("matchId");

-- CreateIndex
CREATE INDEX "MatchPlayerStat_matchId_idx" ON "MatchPlayerStat"("matchId");

-- CreateIndex
CREATE INDEX "MatchPlayerStat_playerId_idx" ON "MatchPlayerStat"("playerId");

-- AddForeignKey
ALTER TABLE "MatchLineupEntry" ADD CONSTRAINT "MatchLineupEntry_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineupEntry" ADD CONSTRAINT "MatchLineupEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineupEntry" ADD CONSTRAINT "MatchLineupEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSubstitution" ADD CONSTRAINT "MatchSubstitution_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSubstitution" ADD CONSTRAINT "MatchSubstitution_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSubstitution" ADD CONSTRAINT "MatchSubstitution_playerInId_fkey" FOREIGN KEY ("playerInId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSubstitution" ADD CONSTRAINT "MatchSubstitution_playerOutId_fkey" FOREIGN KEY ("playerOutId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayerStat" ADD CONSTRAINT "MatchPlayerStat_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayerStat" ADD CONSTRAINT "MatchPlayerStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
