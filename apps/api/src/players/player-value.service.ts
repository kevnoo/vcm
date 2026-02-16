import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Position } from '../generated/prisma/client';

// Skill group weights per position (sum to 1.0 per row)
// Columns: Pace, Shooting, Passing, Dribbling, Defending, Physical
const POSITION_WEIGHTS: Record<string, Record<string, number>> = {
  GK:  { Pace: 0.05, Shooting: 0.00, Passing: 0.10, Dribbling: 0.05, Defending: 0.40, Physical: 0.40 },
  CB:  { Pace: 0.10, Shooting: 0.02, Passing: 0.10, Dribbling: 0.05, Defending: 0.43, Physical: 0.30 },
  RB:  { Pace: 0.20, Shooting: 0.05, Passing: 0.15, Dribbling: 0.10, Defending: 0.30, Physical: 0.20 },
  LB:  { Pace: 0.20, Shooting: 0.05, Passing: 0.15, Dribbling: 0.10, Defending: 0.30, Physical: 0.20 },
  CDM: { Pace: 0.10, Shooting: 0.05, Passing: 0.20, Dribbling: 0.10, Defending: 0.35, Physical: 0.20 },
  CM:  { Pace: 0.10, Shooting: 0.10, Passing: 0.30, Dribbling: 0.20, Defending: 0.15, Physical: 0.15 },
  CAM: { Pace: 0.10, Shooting: 0.20, Passing: 0.25, Dribbling: 0.25, Defending: 0.05, Physical: 0.15 },
  RM:  { Pace: 0.20, Shooting: 0.15, Passing: 0.20, Dribbling: 0.20, Defending: 0.10, Physical: 0.15 },
  LM:  { Pace: 0.20, Shooting: 0.15, Passing: 0.20, Dribbling: 0.20, Defending: 0.10, Physical: 0.15 },
  RW:  { Pace: 0.20, Shooting: 0.20, Passing: 0.15, Dribbling: 0.25, Defending: 0.05, Physical: 0.15 },
  LW:  { Pace: 0.20, Shooting: 0.20, Passing: 0.15, Dribbling: 0.25, Defending: 0.05, Physical: 0.15 },
  CF:  { Pace: 0.15, Shooting: 0.25, Passing: 0.15, Dribbling: 0.25, Defending: 0.03, Physical: 0.17 },
  ST:  { Pace: 0.15, Shooting: 0.35, Passing: 0.10, Dribbling: 0.15, Defending: 0.02, Physical: 0.23 },
};

const ROLE_BONUSES: Record<string, number> = {
  BASIC: 50,
  INTERMEDIATE: 100,
  ADVANCED: 200,
};

const PLAY_STYLE_BONUSES: Record<string, number> = {
  BASIC: 30,
  ADVANCED: 75,
};

@Injectable()
export class PlayerValueService {
  constructor(private prisma: PrismaService) {}

  async computeValue(playerId: string) {
    const player = await this.prisma.player.findUniqueOrThrow({
      where: { id: playerId },
      include: {
        skills: {
          include: { skillDefinition: { include: { skillGroup: true } } },
        },
        roles: true,
        playStyles: true,
      },
    });

    return this.calculateValue(player);
  }

  calculateValue(player: {
    primaryPosition: Position;
    skills: Array<{
      value: number;
      skillDefinition: { skillGroup: { name: string } };
    }>;
    roles: Array<{ level: string }>;
    playStyles: Array<{ level: string }>;
  }) {
    const weights = POSITION_WEIGHTS[player.primaryPosition];
    if (!weights) {
      return { baseValue: 0, roleBonuses: 0, playStyleBonuses: 0, totalValue: 0, weightedScore: 0, groupScores: {} };
    }

    // Group skills by skill group and compute averages
    const groupSkills: Record<string, number[]> = {};
    for (const skill of player.skills) {
      const groupName = skill.skillDefinition.skillGroup.name;
      if (!groupSkills[groupName]) groupSkills[groupName] = [];
      groupSkills[groupName].push(skill.value);
    }

    const groupScores: Record<string, number> = {};
    let weightedScore = 0;
    for (const [groupName, weight] of Object.entries(weights)) {
      const skills = groupSkills[groupName] ?? [];
      const avg = skills.length > 0 ? skills.reduce((a, b) => a + b, 0) / skills.length : 0;
      groupScores[groupName] = Math.round(avg * 100) / 100;
      weightedScore += avg * weight;
    }

    weightedScore = Math.round(weightedScore * 100) / 100;
    const baseValue = Math.round(weightedScore * 100);

    // Role bonuses
    let roleBonuses = 0;
    for (const role of player.roles) {
      roleBonuses += ROLE_BONUSES[role.level] ?? 0;
    }

    // Play style bonuses
    let playStyleBonuses = 0;
    for (const ps of player.playStyles) {
      playStyleBonuses += PLAY_STYLE_BONUSES[ps.level] ?? 0;
    }

    const totalValue = baseValue + roleBonuses + playStyleBonuses;

    return { baseValue, roleBonuses, playStyleBonuses, totalValue, weightedScore, groupScores };
  }
}
