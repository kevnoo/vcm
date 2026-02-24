import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchMessageDto } from './dto/create-match-message.dto';
import { CreateTimeProposalDto } from './dto/create-time-proposal.dto';
import { RespondTimeProposalDto } from './dto/respond-time-proposal.dto';

interface AuthUser {
  id: string;
  role: string;
}

@Injectable()
export class MatchSchedulingService {
  constructor(private prisma: PrismaService) {}

  async getMatchHub(matchId: string, user: AuthUser) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: {
        homeTeam: { include: { owner: true } },
        awayTeam: { include: { owner: true } },
        result: {
          include: { submittedBy: true, disputedBy: true, resolvedBy: true },
        },
        round: { include: { competition: true } },
      },
    });

    const isAdmin = user.role === 'ADMIN';
    const isInvolved =
      match.homeTeam.ownerId === user.id ||
      match.awayTeam.ownerId === user.id;

    // Base match data is visible to everyone
    const hub: Record<string, unknown> = {
      match,
      role: isAdmin ? 'ADMIN' : isInvolved ? 'INVOLVED' : 'VIEWER',
    };

    // Messages and proposals only visible to admins and involved owners
    if (isAdmin || isInvolved) {
      const [messages, timeProposals] = await Promise.all([
        this.prisma.matchMessage.findMany({
          where: { matchId },
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.timeProposal.findMany({
          where: { matchId },
          include: { proposedBy: true, respondedBy: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      hub.messages = messages;
      hub.timeProposals = timeProposals;
    }

    return hub;
  }

  async createMessage(
    matchId: string,
    dto: CreateMatchMessageDto,
    user: AuthUser,
  ) {
    const match = await this.getMatchWithOwners(matchId);
    this.assertInvolvedOrAdmin(match, user);

    return this.prisma.matchMessage.create({
      data: {
        matchId,
        authorId: user.id,
        content: dto.content,
      },
      include: { author: true },
    });
  }

  async getMessages(matchId: string, user: AuthUser) {
    const match = await this.getMatchWithOwners(matchId);
    this.assertInvolvedOrAdmin(match, user);

    return this.prisma.matchMessage.findMany({
      where: { matchId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async proposeTime(
    matchId: string,
    dto: CreateTimeProposalDto,
    user: AuthUser,
  ) {
    const match = await this.getMatchWithOwners(matchId);
    this.assertInvolvedOrAdmin(match, user);

    if (match.status === 'COMPLETED' || match.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot propose a time for a completed or cancelled match',
      );
    }

    // Cancel any existing PENDING proposals for this match
    await this.prisma.timeProposal.updateMany({
      where: { matchId, status: 'PENDING' },
      data: { status: 'DECLINED' },
    });

    return this.prisma.timeProposal.create({
      data: {
        matchId,
        proposedById: user.id,
        proposedTime: new Date(dto.proposedTime),
      },
      include: { proposedBy: true },
    });
  }

  async respondToProposal(
    proposalId: string,
    dto: RespondTimeProposalDto,
    user: AuthUser,
  ) {
    const proposal = await this.prisma.timeProposal.findUniqueOrThrow({
      where: { id: proposalId },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
    });

    if (proposal.status !== 'PENDING') {
      throw new BadRequestException('This proposal is no longer pending');
    }

    const match = proposal.match;
    const isAdmin = user.role === 'ADMIN';
    const isInvolved =
      match.homeTeam.ownerId === user.id ||
      match.awayTeam.ownerId === user.id;

    if (!isAdmin && !isInvolved) {
      throw new ForbiddenException(
        'Only admins or involved team owners can respond to proposals',
      );
    }

    // The proposer cannot accept their own proposal (but can decline it)
    if (dto.response === 'ACCEPTED' && proposal.proposedById === user.id && !isAdmin) {
      throw new BadRequestException('You cannot accept your own proposal');
    }

    const updated = await this.prisma.timeProposal.update({
      where: { id: proposalId },
      data: {
        status: dto.response,
        respondedById: user.id,
        respondedAt: new Date(),
      },
      include: { proposedBy: true, respondedBy: true },
    });

    // If accepted, set the match scheduledAt
    if (dto.response === 'ACCEPTED') {
      await this.prisma.match.update({
        where: { id: match.id },
        data: { scheduledAt: proposal.proposedTime },
      });
    }

    return updated;
  }

  async setMatchTime(matchId: string, scheduledAt: string, user: AuthUser) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can directly set match times');
    }

    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
    });

    if (match.status === 'COMPLETED' || match.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot set time for a completed or cancelled match',
      );
    }

    // Cancel any pending proposals
    await this.prisma.timeProposal.updateMany({
      where: { matchId, status: 'PENDING' },
      data: { status: 'DECLINED' },
    });

    return this.prisma.match.update({
      where: { id: matchId },
      data: { scheduledAt: new Date(scheduledAt) },
      include: {
        homeTeam: { include: { owner: true } },
        awayTeam: { include: { owner: true } },
        round: { include: { competition: true } },
      },
    });
  }

  private async getMatchWithOwners(matchId: string) {
    return this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });
  }

  private assertInvolvedOrAdmin(
    match: { homeTeam: { ownerId: string }; awayTeam: { ownerId: string } },
    user: AuthUser,
  ) {
    const isAdmin = user.role === 'ADMIN';
    const isInvolved =
      match.homeTeam.ownerId === user.id ||
      match.awayTeam.ownerId === user.id;

    if (!isAdmin && !isInvolved) {
      throw new ForbiddenException(
        'Only admins or involved team owners can access this',
      );
    }
  }
}
