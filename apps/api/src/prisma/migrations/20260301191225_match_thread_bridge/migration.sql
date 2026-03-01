-- CreateEnum
CREATE TYPE "MessageSource" AS ENUM ('WEB', 'DISCORD');

-- DropForeignKey
ALTER TABLE "MatchMessage" DROP CONSTRAINT "MatchMessage_authorId_fkey";

-- AlterTable
ALTER TABLE "DiscordChannelMapping" ADD COLUMN     "webhookUrl" TEXT;

-- AlterTable
ALTER TABLE "MatchMessage" ADD COLUMN     "attachmentUrls" JSONB,
ADD COLUMN     "authorAvatarUrl" TEXT,
ADD COLUMN     "authorDiscordId" TEXT,
ADD COLUMN     "authorName" TEXT,
ADD COLUMN     "discordMessageId" TEXT,
ADD COLUMN     "source" "MessageSource" NOT NULL DEFAULT 'WEB',
ALTER COLUMN "authorId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "MatchMessage_discordMessageId_idx" ON "MatchMessage"("discordMessageId");

-- AddForeignKey
ALTER TABLE "MatchMessage" ADD CONSTRAINT "MatchMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
