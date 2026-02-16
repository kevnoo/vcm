-- CreateTable
CREATE TABLE "PlayerPosition" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerPosition_playerId_position_key" ON "PlayerPosition"("playerId", "position");

-- AddForeignKey
ALTER TABLE "PlayerPosition" ADD CONSTRAINT "PlayerPosition_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: create a PlayerPosition for each existing player's primaryPosition
INSERT INTO "PlayerPosition" ("id", "playerId", "position", "isPrimary", "createdAt")
SELECT gen_random_uuid(), "id", "primaryPosition", true, NOW()
FROM "Player";

-- Add new column to PlayerRoleAssignment
ALTER TABLE "PlayerRoleAssignment" ADD COLUMN "playerPositionId" TEXT;

-- Backfill: link existing role assignments to the player's primary position
UPDATE "PlayerRoleAssignment" pra
SET "playerPositionId" = pp."id"
FROM "PlayerPosition" pp
WHERE pp."playerId" = pra."playerId" AND pp."isPrimary" = true;

-- Drop old unique constraint and foreign key
ALTER TABLE "PlayerRoleAssignment" DROP CONSTRAINT IF EXISTS "PlayerRoleAssignment_playerId_playerRoleDefinitionId_key";
ALTER TABLE "PlayerRoleAssignment" DROP CONSTRAINT IF EXISTS "PlayerRoleAssignment_playerId_fkey";

-- Drop old column
ALTER TABLE "PlayerRoleAssignment" DROP COLUMN "playerId";

-- Make playerPositionId non-nullable
ALTER TABLE "PlayerRoleAssignment" ALTER COLUMN "playerPositionId" SET NOT NULL;

-- Add new unique constraint and foreign key
CREATE UNIQUE INDEX "PlayerRoleAssignment_playerPositionId_playerRoleDefinitionId_key" ON "PlayerRoleAssignment"("playerPositionId", "playerRoleDefinitionId");
ALTER TABLE "PlayerRoleAssignment" ADD CONSTRAINT "PlayerRoleAssignment_playerPositionId_fkey" FOREIGN KEY ("playerPositionId") REFERENCES "PlayerPosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
