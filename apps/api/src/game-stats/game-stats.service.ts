import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveLineupDto } from './dto/save-lineup.dto';
import { SaveSubstitutionsDto } from './dto/save-substitutions.dto';
import { SavePlayerStatsDto } from './dto/save-player-stats.dto';

interface AuthUser {
  id: string;
  role: string;
}

@Injectable()
export class GameStatsService {
  constructor(private prisma: PrismaService) {}

  async getMatchStats(matchId: string) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        result: true,
      },
    });

    const [lineupEntries, substitutions, playerStats] = await Promise.all([
      this.prisma.matchLineupEntry.findMany({
        where: { matchId },
        include: { player: true },
        orderBy: [{ isStarter: 'desc' }, { position: 'asc' }],
      }),
      this.prisma.matchSubstitution.findMany({
        where: { matchId },
        include: { playerIn: true, playerOut: true },
        orderBy: { minute: 'asc' },
      }),
      this.prisma.matchPlayerStat.findMany({
        where: { matchId },
        include: { player: true },
        orderBy: { minute: 'asc' },
      }),
    ]);

    const homeLineup = lineupEntries.filter(
      (e) => e.teamId === match.homeTeamId,
    );
    const awayLineup = lineupEntries.filter(
      (e) => e.teamId === match.awayTeamId,
    );

    // Calculate minutes played for all players involved
    const matchDuration = 90;
    const playerMinutes = this.calculateMinutesPlayed(
      lineupEntries,
      substitutions,
      matchDuration,
    );

    return {
      matchId,
      homeLineup,
      awayLineup,
      substitutions,
      playerStats,
      playerMinutes,
    };
  }

  async saveLineup(
    matchId: string,
    teamId: string,
    dto: SaveLineupDto,
    user: AuthUser,
  ) {
    await this.assertCanEditStats(matchId, teamId, user);

    await this.prisma.$transaction(async (tx) => {
      // Delete existing lineup entries for this team in this match
      await tx.matchLineupEntry.deleteMany({
        where: { matchId, teamId },
      });

      // Create new entries
      await tx.matchLineupEntry.createMany({
        data: dto.entries.map((entry) => ({
          matchId,
          teamId,
          playerId: entry.playerId,
          position: entry.position,
          isStarter: entry.isStarter,
        })),
      });
    });

    return this.getMatchStats(matchId);
  }

  async saveSubstitutions(
    matchId: string,
    teamId: string,
    dto: SaveSubstitutionsDto,
    user: AuthUser,
  ) {
    await this.assertCanEditStats(matchId, teamId, user);

    await this.prisma.$transaction(async (tx) => {
      // Delete existing substitutions for this team in this match
      await tx.matchSubstitution.deleteMany({
        where: { matchId, teamId },
      });

      // Create new substitutions
      await tx.matchSubstitution.createMany({
        data: dto.substitutions.map((sub) => ({
          matchId,
          teamId,
          playerInId: sub.playerInId,
          playerOutId: sub.playerOutId,
          minute: sub.minute,
        })),
      });
    });

    return this.getMatchStats(matchId);
  }

  async savePlayerStats(
    matchId: string,
    dto: SavePlayerStatsDto,
    user: AuthUser,
  ) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    });

    const isAdmin = user.role === 'ADMIN';
    const isOwner =
      match.homeTeam.ownerId === user.id ||
      match.awayTeam.ownerId === user.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'Only admins or team owners can submit match stats',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete existing player stats for this match
      await tx.matchPlayerStat.deleteMany({
        where: { matchId },
      });

      // Create new stats
      await tx.matchPlayerStat.createMany({
        data: dto.stats.map((stat) => ({
          matchId,
          playerId: stat.playerId,
          statType: stat.statType,
          value: stat.value,
          minute: stat.minute ?? null,
        })),
      });
    });

    return this.getMatchStats(matchId);
  }

  private async assertCanEditStats(
    matchId: string,
    teamId: string,
    user: AuthUser,
  ) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    });

    if (match.homeTeamId !== teamId && match.awayTeamId !== teamId) {
      throw new BadRequestException('Team is not part of this match');
    }

    const isAdmin = user.role === 'ADMIN';
    const team = teamId === match.homeTeamId ? match.homeTeam : match.awayTeam;
    const isTeamOwner = team.ownerId === user.id;

    if (!isAdmin && !isTeamOwner) {
      throw new ForbiddenException(
        'Only admins or the team owner can edit lineup/substitutions',
      );
    }
  }

  private calculateMinutesPlayed(
    lineupEntries: { playerId: string; isStarter: boolean }[],
    substitutions: { playerInId: string; playerOutId: string; minute: number }[],
    matchDuration: number,
  ) {
    const minutesMap = new Map<string, number>();

    // Starters begin at minute 0
    for (const entry of lineupEntries) {
      if (entry.isStarter) {
        minutesMap.set(entry.playerId, matchDuration);
      }
    }

    // Process substitutions: playerOut loses remaining minutes, playerIn gains them
    for (const sub of substitutions) {
      const outCurrent = minutesMap.get(sub.playerOutId) ?? 0;
      const remainingFromStart = matchDuration - sub.minute;

      // Player going out: subtract the remaining minutes they won't play
      minutesMap.set(sub.playerOutId, Math.max(0, outCurrent - remainingFromStart));

      // Player coming in: gains remaining minutes
      const inCurrent = minutesMap.get(sub.playerInId) ?? 0;
      minutesMap.set(sub.playerInId, inCurrent + remainingFromStart);
    }

    return Array.from(minutesMap.entries()).map(([playerId, minutesPlayed]) => ({
      playerId,
      minutesPlayed,
    }));
  }
}
