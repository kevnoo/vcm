-- CreateEnum
CREATE TYPE "ItemEffectType" AS ENUM ('BOOST_OVERALL', 'BOOST_WEAK_FOOT', 'BOOST_POTENTIAL', 'SET_OVERALL');

-- AlterTable: Add player attributes
ALTER TABLE "Player" ADD COLUMN "overall" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Player" ADD COLUMN "weakFoot" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Player" ADD COLUMN "potential" INTEGER NOT NULL DEFAULT 50;

-- CreateTable
CREATE TABLE "ItemDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effectType" "ItemEffectType" NOT NULL,
    "effectValue" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamItem" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "itemDefinitionId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemUsageLog" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "itemDefinitionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "previousValue" INTEGER NOT NULL,
    "newValue" INTEGER NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemDefinition_name_key" ON "ItemDefinition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TeamItem_teamId_itemDefinitionId_key" ON "TeamItem"("teamId", "itemDefinitionId");

-- AddForeignKey
ALTER TABLE "TeamItem" ADD CONSTRAINT "TeamItem_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamItem" ADD CONSTRAINT "TeamItem_itemDefinitionId_fkey" FOREIGN KEY ("itemDefinitionId") REFERENCES "ItemDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemUsageLog" ADD CONSTRAINT "ItemUsageLog_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemUsageLog" ADD CONSTRAINT "ItemUsageLog_itemDefinitionId_fkey" FOREIGN KEY ("itemDefinitionId") REFERENCES "ItemDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemUsageLog" ADD CONSTRAINT "ItemUsageLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
