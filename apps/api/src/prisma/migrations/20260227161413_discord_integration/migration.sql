-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('SCREENSHOT', 'VIDEO', 'REPLAY');

-- CreateEnum
CREATE TYPE "DiscordChannelType" AS ENUM ('SCHEDULE', 'RESULTS', 'TRANSACTIONS', 'MEDIA');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "discordThreadId" TEXT;

-- CreateTable
CREATE TABLE "MatchMedia" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "discordMessageId" TEXT,
    "url" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "uploadedById" TEXT,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscordChannelMapping" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "discordGuildId" TEXT NOT NULL,
    "discordChannelId" TEXT NOT NULL,
    "channelType" "DiscordChannelType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordChannelMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchMedia_matchId_idx" ON "MatchMedia"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscordChannelMapping_competitionId_channelType_key" ON "DiscordChannelMapping"("competitionId", "channelType");

-- AddForeignKey
ALTER TABLE "MatchMedia" ADD CONSTRAINT "MatchMedia_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchMedia" ADD CONSTRAINT "MatchMedia_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscordChannelMapping" ADD CONSTRAINT "DiscordChannelMapping_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
