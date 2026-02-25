import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatDelegatesService } from '../stat-delegates/stat-delegates.service';
import { SubmitGameStatsDto } from './dto/submit-game-stats.dto';
import { ConfirmGameStatsDto } from './dto/confirm-game-stats.dto';
import { DisputeStatFieldDto } from './dto/dispute-stat-field.dto';
import { ResolveStatDisputeDto } from './dto/resolve-stat-dispute.dto';

interface AuthUser {
  id: string;
  role: string;
}

@Injectable()
export class PlayerGameStatsService {
  private static readonly DISPUTABLE_FIELDS = [
    'rating', 'goals', 'assists', 'shots', 'shotAccuracy',
    'passes', 'passAccuracy', 'dribbles', 'dribbleSuccessRate',
    'tackles', 'tackleSuccessRate', 'offsides', 'foulsCommitted',
    'possessionsWon', 'possessionsLost', 'minutesPlayed',
    'yellowCards', 'redCards',
    'shotsAgainst', 'shotsOnTarget', 'saves', 'goalsConceded',
    'saveSuccessRate', 'cleanSheet',
  ];

  constructor(
    private prisma: PrismaService,
    private statDelegatesService: StatDelegatesService,
  ) {}

  async getMatchGameStats(matchId: string) {
    return this.prisma.matchPlayerGameStats.findMany({
      where: { matchId },
      include: {
        player: true,
        submittedBy: true,
        disputes: { include: { disputedBy: true, resolvedBy: true } },
      },
      orderBy: [{ teamId: 'asc' }, { position: 'asc' }],
    });
  }

  async submit(matchId: string, dto: SubmitGameStatsDto, user: AuthUser) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        result: true,
      },
    });

    // Result must be confirmed or resolved
    if (
      !match.result ||
      !['CONFIRMED', 'RESOLVED'].includes(match.result.status)
    ) {
      throw new BadRequestException(
        'Match result must be confirmed or resolved before submitting game stats',
      );
    }

    // Validate team is part of this match
    if (match.homeTeamId !== dto.teamId && match.awayTeamId !== dto.teamId) {
      throw new BadRequestException('Team is not part of this match');
    }

    // Check permissions: admin, team owner, or delegate
    const isAdmin = user.role === 'ADMIN';
    const team =
      dto.teamId === match.homeTeamId ? match.homeTeam : match.awayTeam;
    const isTeamOwner = team.ownerId === user.id;
    const isDelegate = await this.statDelegatesService.isDelegate(
      dto.teamId,
      user.id,
    );

    if (!isAdmin && !isTeamOwner && !isDelegate) {
      throw new ForbiddenException(
        'Only admins, the team owner, or a delegate can submit game stats',
      );
    }

    // Check if stats already submitted for this team in this match
    const existing = await this.prisma.matchPlayerGameStats.findFirst({
      where: { matchId, teamId: dto.teamId },
    });

    if (existing) {
      throw new ConflictException(
        'Game stats already submitted for this team in this match',
      );
    }

    const status = isAdmin ? 'CONFIRMED' : 'PENDING';

    const created = await this.prisma.$transaction(
      dto.stats.map((stat) =>
        this.prisma.matchPlayerGameStats.create({
          data: {
            matchId,
            playerId: stat.playerId,
            teamId: dto.teamId,
            submittedById: user.id,
            position: stat.position,
            isSubstitute: stat.isSubstitute,
            rating: stat.rating,
            goals: stat.goals,
            assists: stat.assists,
            shots: stat.shots,
            shotAccuracy: stat.shotAccuracy,
            passes: stat.passes,
            passAccuracy: stat.passAccuracy,
            dribbles: stat.dribbles,
            dribbleSuccessRate: stat.dribbleSuccessRate,
            tackles: stat.tackles,
            tackleSuccessRate: stat.tackleSuccessRate,
            offsides: stat.offsides,
            foulsCommitted: stat.foulsCommitted,
            possessionsWon: stat.possessionsWon,
            possessionsLost: stat.possessionsLost,
            minutesPlayed: stat.minutesPlayed,
            yellowCards: stat.yellowCards,
            redCards: stat.redCards,
            shotsAgainst: stat.shotsAgainst ?? null,
            shotsOnTarget: stat.shotsOnTarget ?? null,
            saves: stat.saves ?? null,
            goalsConceded: stat.goalsConceded ?? null,
            saveSuccessRate: stat.saveSuccessRate ?? null,
            cleanSheet: stat.cleanSheet ?? null,
            status,
          },
          include: { player: true },
        }),
      ),
    );

    return created;
  }

  async confirm(matchId: string, dto: ConfirmGameStatsDto, user: AuthUser) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    });

    // Must be admin or the opposing team's owner
    const isAdmin = user.role === 'ADMIN';
    const opposingTeam =
      dto.teamId === match.homeTeamId ? match.awayTeam : match.homeTeam;
    const isOpposingOwner = opposingTeam.ownerId === user.id;

    if (!isAdmin && !isOpposingOwner) {
      throw new ForbiddenException(
        'Only admins or the opposing team owner can confirm game stats',
      );
    }

    return this.prisma.matchPlayerGameStats.updateMany({
      where: {
        matchId,
        teamId: dto.teamId,
        status: 'PENDING',
      },
      data: { status: 'CONFIRMED' },
    });
  }

  async disputeFields(gameStatsId: string, dto: DisputeStatFieldDto, user: AuthUser) {
    const gameStats = await this.prisma.matchPlayerGameStats.findUniqueOrThrow({
      where: { id: gameStatsId },
      include: {
        match: { include: { homeTeam: true, awayTeam: true } },
      },
    });

    if (!['PENDING', 'CONFIRMED'].includes(gameStats.status)) {
      throw new BadRequestException('Can only dispute PENDING or CONFIRMED stats');
    }

    // Verify user is opposing owner or admin
    const isAdmin = user.role === 'ADMIN';
    const opposingTeam =
      gameStats.teamId === gameStats.match.homeTeamId
        ? gameStats.match.awayTeam
        : gameStats.match.homeTeam;
    const isOpposingOwner = opposingTeam.ownerId === user.id;

    if (!isAdmin && !isOpposingOwner) {
      throw new ForbiddenException('Only the opposing team owner or an admin can dispute stats');
    }

    // Validate field names
    for (const field of dto.fields) {
      if (!PlayerGameStatsService.DISPUTABLE_FIELDS.includes(field.fieldName)) {
        throw new BadRequestException(`Invalid field name: ${field.fieldName}`);
      }
    }

    // Create dispute records and update game stats status
    return this.prisma.$transaction(async (tx) => {
      const disputes = await Promise.all(
        dto.fields.map((field) =>
          tx.statDispute.create({
            data: {
              gameStatsId,
              fieldName: field.fieldName,
              disputedById: user.id,
              reason: field.reason ?? null,
            },
            include: { disputedBy: true },
          }),
        ),
      );

      await tx.matchPlayerGameStats.update({
        where: { id: gameStatsId },
        data: { status: 'DISPUTED' },
      });

      return disputes;
    });
  }

  async resolveDispute(disputeId: string, dto: ResolveStatDisputeDto, adminId: string) {
    const dispute = await this.prisma.statDispute.findUniqueOrThrow({
      where: { id: disputeId },
      include: { gameStats: true },
    });

    if (dispute.status !== 'OPEN') {
      throw new BadRequestException('Dispute is already resolved');
    }

    return this.prisma.$transaction(async (tx) => {
      const resolved = await tx.statDispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          resolvedById: adminId,
          resolutionNote: dto.note ?? null,
        },
        include: { disputedBy: true, resolvedBy: true },
      });

      // If a corrected value was provided, update the game stats field
      if (dto.correctedValue !== undefined) {
        await tx.matchPlayerGameStats.update({
          where: { id: dispute.gameStatsId },
          data: { [dispute.fieldName]: dto.correctedValue },
        });
      }

      // Check if all disputes for this game stats entry are resolved
      const openDisputes = await tx.statDispute.count({
        where: { gameStatsId: dispute.gameStatsId, status: 'OPEN' },
      });

      if (openDisputes === 0) {
        await tx.matchPlayerGameStats.update({
          where: { id: dispute.gameStatsId },
          data: { status: 'RESOLVED' },
        });
      }

      return resolved;
    });
  }

  async findOpenDisputes() {
    return this.prisma.statDispute.findMany({
      where: { status: 'OPEN' },
      include: {
        gameStats: {
          include: {
            player: true,
            match: {
              include: {
                homeTeam: true,
                awayTeam: true,
                round: { include: { competition: true } },
              },
            },
          },
        },
        disputedBy: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
