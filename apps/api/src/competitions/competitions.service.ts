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
      include: { teams: { include: { team: true } } },
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

    if (competition.rounds.length > 0) {
      throw new BadRequestException(
        'Schedule already generated. Delete existing rounds first.',
      );
    }

    const teamIds = competition.teams.map((ct) => ct.teamId);

    await this.scheduleGenerator.generate(
      competitionId,
      competition.type,
      teamIds,
    );

    return this.findById(competitionId);
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
