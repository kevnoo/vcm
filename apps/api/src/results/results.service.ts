import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitResultDto } from './dto/submit-result.dto';
import { DisputeResultDto } from './dto/dispute-result.dto';
import { ResolveResultDto } from './dto/resolve-result.dto';

interface AuthUser {
  id: string;
  role: string;
}

@Injectable()
export class ResultsService {
  constructor(private prisma: PrismaService) {}

  async submit(matchId: string, dto: SubmitResultDto, submitter: AuthUser) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        result: true,
      },
    });

    if (match.result) {
      throw new ConflictException('Result already submitted for this match');
    }

    const isAdmin = submitter.role === 'ADMIN';
    const isOwner =
      match.homeTeam.ownerId === submitter.id ||
      match.awayTeam.ownerId === submitter.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'Only admins or team owners can submit results',
      );
    }

    const status = isAdmin ? 'CONFIRMED' : 'PENDING';

    const result = await this.prisma.result.create({
      data: {
        matchId,
        homeScore: dto.homeScore,
        awayScore: dto.awayScore,
        submittedById: submitter.id,
        status,
      },
      include: { submittedBy: true },
    });

    if (status === 'CONFIRMED') {
      await this.prisma.match.update({
        where: { id: matchId },
        data: { status: 'COMPLETED' },
      });
    }

    return result;
  }

  async dispute(resultId: string, dto: DisputeResultDto, disputer: AuthUser) {
    const result = await this.prisma.result.findUniqueOrThrow({
      where: { id: resultId },
      include: {
        match: { include: { homeTeam: true, awayTeam: true } },
      },
    });

    if (result.status !== 'PENDING') {
      throw new BadRequestException('Can only dispute PENDING results');
    }

    // Verify disputer is the opposing owner
    const ownerIds = [
      result.match.homeTeam.ownerId,
      result.match.awayTeam.ownerId,
    ];
    const isMatchOwner = ownerIds.includes(disputer.id);
    const isSubmitter = result.submittedById === disputer.id;

    if (!isMatchOwner || isSubmitter) {
      throw new ForbiddenException(
        'Only the opposing team owner can dispute a result',
      );
    }

    return this.prisma.result.update({
      where: { id: resultId },
      data: {
        status: 'DISPUTED',
        disputedById: disputer.id,
        disputeReason: dto.reason,
      },
      include: { submittedBy: true, disputedBy: true },
    });
  }

  async resolve(resultId: string, dto: ResolveResultDto) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.result.update({
        where: { id: resultId },
        data: {
          status: 'RESOLVED',
          homeScore: dto.homeScore,
          awayScore: dto.awayScore,
          resolutionNote: dto.note,
        },
        include: { submittedBy: true, disputedBy: true, resolvedBy: true },
      });

      await tx.match.update({
        where: { id: result.matchId },
        data: { status: 'COMPLETED' },
      });

      return result;
    });
  }

  async confirm(resultId: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.result.update({
        where: { id: resultId },
        data: {
          status: 'CONFIRMED',
          resolvedById: adminId,
        },
        include: { submittedBy: true },
      });

      await tx.match.update({
        where: { id: result.matchId },
        data: { status: 'COMPLETED' },
      });

      return result;
    });
  }

  findDisputed() {
    return this.prisma.result.findMany({
      where: { status: 'DISPUTED' },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            round: { include: { competition: true } },
          },
        },
        submittedBy: true,
        disputedBy: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
