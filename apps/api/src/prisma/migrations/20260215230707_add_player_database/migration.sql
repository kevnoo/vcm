-- CreateEnum
CREATE TYPE "Position" AS ENUM ('GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'CF', 'ST');

-- CreateEnum
CREATE TYPE "RoleLevel" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "PlayStyleLevel" AS ENUM ('BASIC', 'ADVANCED');

-- CreateTable
CREATE TABLE "SkillGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skillGroupId" TEXT NOT NULL,
    "defaultValue" INTEGER NOT NULL DEFAULT 50,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerRoleDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerRoleDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayStyleDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "iconUrl" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayStyleDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "primaryPosition" "Position" NOT NULL,
    "teamId" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSkill" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "skillDefinitionId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "PlayerSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerRoleAssignment" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerRoleDefinitionId" TEXT NOT NULL,
    "level" "RoleLevel" NOT NULL,

    CONSTRAINT "PlayerRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerPlayStyleAssignment" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playStyleDefinitionId" TEXT NOT NULL,
    "level" "PlayStyleLevel" NOT NULL,

    CONSTRAINT "PlayerPlayStyleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillGroup_name_key" ON "SkillGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SkillDefinition_name_key" ON "SkillDefinition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerRoleDefinition_name_position_key" ON "PlayerRoleDefinition"("name", "position");

-- CreateIndex
CREATE UNIQUE INDEX "PlayStyleDefinition_name_position_key" ON "PlayStyleDefinition"("name", "position");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSkill_playerId_skillDefinitionId_key" ON "PlayerSkill"("playerId", "skillDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerRoleAssignment_playerId_playerRoleDefinitionId_key" ON "PlayerRoleAssignment"("playerId", "playerRoleDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerPlayStyleAssignment_playerId_playStyleDefinitionId_key" ON "PlayerPlayStyleAssignment"("playerId", "playStyleDefinitionId");

-- AddForeignKey
ALTER TABLE "SkillDefinition" ADD CONSTRAINT "SkillDefinition_skillGroupId_fkey" FOREIGN KEY ("skillGroupId") REFERENCES "SkillGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSkill" ADD CONSTRAINT "PlayerSkill_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSkill" ADD CONSTRAINT "PlayerSkill_skillDefinitionId_fkey" FOREIGN KEY ("skillDefinitionId") REFERENCES "SkillDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRoleAssignment" ADD CONSTRAINT "PlayerRoleAssignment_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRoleAssignment" ADD CONSTRAINT "PlayerRoleAssignment_playerRoleDefinitionId_fkey" FOREIGN KEY ("playerRoleDefinitionId") REFERENCES "PlayerRoleDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerPlayStyleAssignment" ADD CONSTRAINT "PlayerPlayStyleAssignment_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerPlayStyleAssignment" ADD CONSTRAINT "PlayerPlayStyleAssignment_playStyleDefinitionId_fkey" FOREIGN KEY ("playStyleDefinitionId") REFERENCES "PlayStyleDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
