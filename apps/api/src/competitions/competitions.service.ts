import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { AddTeamsDto } from './dto/add-teams.dto';
import { ScheduleGeneratorService } from './schedule/schedule-generator.service';

@Injectable()
export class CompetitionsService {
  constructor(
    private prisma: PrismaService,
    private scheduleGenerator: ScheduleGeneratorService,
  ) {}

  findAll() {
    return this.prisma.competition.findMany({
      include: {
        teams: { include: { team: true } },
        rounds: {
          include: {
            matches: {
              include: {
                homeTeam: true,
                awayTeam: true,
                result: true,
              },
              orderBy: { matchNumber: 'asc' },
            },
          },
          orderBy: { roundNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.competition.findUniqueOrThrow({
      where: { id },
      include: {
        teams: { include: { team: { include: { owner: true } } } },
        rounds: {
          include: {
            matches: {
              include: {
                homeTeam: true,
                awayTeam: true,
                result: true,
              },
              orderBy: { matchNumber: 'asc' },
            },
          },
          orderBy: { roundNumber: 'asc' },
        },
      },
    });
  }

  create(dto: CreateCompetitionDto) {
    return this.prisma.competition.create({
      data: {
        name: dto.name,
        type: dto.type as any,
        config: (dto.config as any) || undefined,
      },
    });
  }

  async addTeams(competitionId: string, dto: AddTeamsDto) {
    const competition = await this.prisma.competition.findUniqueOrThrow({
      where: { id: competitionId },
    });

    if (competition.status !== 'DRAFT') {
      throw new BadRequestException(
        'Can only add teams to DRAFT competitions',
      );
    }

    await this.prisma.competitionTeam.createMany({
      data: dto.teamIds.map((teamId) => ({
        competitionId,
        teamId,
      })),
      skipDuplicates: true,
    });

    return this.findById(competitionId);
  }

  async removeTeam(competitionId: string, teamId: string) {
    const competition = await this.prisma.competition.findUniqueOrThrow({
      where: { id: competitionId },
    });

    if (competition.status !== 'DRAFT') {
      throw new BadRequestException(
        'Can only remove teams from DRAFT competitions',
      );
    }

    await this.prisma.competitionTeam.deleteMany({
      where: { competitionId, teamId },
    });

    return this.findById(competitionId);
  }

  async generateSchedule(competitionId: string) {
    const competition = await this.prisma.competition.findUniqueOrThrow({
      where: { id: competitionId },
      include: { teams: true, rounds: true },
    });

    if (competition.status !== 'DRAFT') {
      throw new BadRequestException(
        'Can only generate schedule for DRAFT competitions',
      );
    }

    // If a schedule already exists, delete it before regenerating
    if (competition.rounds.length > 0) {
      await this.prisma.round.deleteMany({
        where: { competitionId },
      });
    }

    const teamIds = competition.teams.map((ct) => ct.teamId);

    await this.scheduleGenerator.generate(
      competitionId,
      competition.type,
      teamIds,
    );

    return this.findById(competitionId);
  }

  async getStandings(competitionId: string) {
    const competition = await this.prisma.competition.findUniqueOrThrow({
      where: { id: competitionId },
      include: {
        teams: { include: { team: true } },
        rounds: {
          include: {
            matches: {
              include: {
                homeTeam: true,
                awayTeam: true,
                result: true,
              },
            },
          },
        },
      },
    });

    // Build a map of team stats
    const statsMap = new Map<string, {
      teamId: string;
      team: any;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      form: ('W' | 'D' | 'L')[];
    }>();

    // Initialize all teams
    for (const ct of competition.teams) {
      statsMap.set(ct.teamId, {
        teamId: ct.teamId,
        team: ct.team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        form: [],
      });
    }

    // Collect all completed matches sorted by round number then match number
    const completedMatches: { homeTeamId: string; awayTeamId: string; homeScore: number; awayScore: number }[] = [];
    for (const round of competition.rounds) {
      for (const match of round.matches) {
        if (match.result && (match.result.status === 'CONFIRMED' || match.result.status === 'RESOLVED')) {
          completedMatches.push({
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            homeScore: match.result.homeScore,
            awayScore: match.result.awayScore,
          });
        }
      }
    }

    // Process each match
    for (const match of completedMatches) {
      const home = statsMap.get(match.homeTeamId);
      const away = statsMap.get(match.awayTeamId);
      if (!home || !away) continue;

      home.played++;
      away.played++;
      home.goalsFor += match.homeScore;
      home.goalsAgainst += match.awayScore;
      away.goalsFor += match.awayScore;
      away.goalsAgainst += match.homeScore;

      if (match.homeScore > match.awayScore) {
        home.won++;
        away.lost++;
        home.form.push('W');
        away.form.push('L');
      } else if (match.homeScore < match.awayScore) {
        home.lost++;
        away.won++;
        home.form.push('L');
        away.form.push('W');
      } else {
        home.drawn++;
        away.drawn++;
        home.form.push('D');
        away.form.push('D');
      }
    }

    // Build standings array
    const standings = Array.from(statsMap.values()).map((s) => ({
      ...s,
      goalDifference: s.goalsFor - s.goalsAgainst,
      points: s.won * 3 + s.drawn,
      form: s.form.slice(-5),
    }));

    // Sort: points desc, goal diff desc, goals for desc, team name asc
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return (a.team?.name ?? '').localeCompare(b.team?.name ?? '');
    });

    return standings;
  }

  async activate(competitionId: string) {
    const competition = await this.prisma.competition.findUniqueOrThrow({
      where: { id: competitionId },
      include: { rounds: true },
    });

    if (competition.status !== 'DRAFT') {
      throw new BadRequestException('Competition is not in DRAFT status');
    }

    if (competition.rounds.length === 0) {
      throw new BadRequestException(
        'Generate a schedule before activating the competition',
      );
    }

    return this.prisma.competition.update({
      where: { id: competitionId },
      data: { status: 'ACTIVE' },
    });
  }
}
