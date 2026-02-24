import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddStatDelegateDto } from './dto/add-stat-delegate.dto';

interface AuthUser {
  id: string;
  role: string;
}

@Injectable()
export class StatDelegatesService {
  constructor(private prisma: PrismaService) {}

  async addDelegate(teamId: string, dto: AddStatDelegateDto, user: AuthUser) {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
    });

    if (user.role !== 'ADMIN' && team.ownerId !== user.id) {
      throw new ForbiddenException('Only the team owner or an admin can manage delegates');
    }

    // Verify delegate user exists
    await this.prisma.user.findUniqueOrThrow({
      where: { id: dto.delegateUserId },
    });

    try {
      return await this.prisma.statDelegate.create({
        data: {
          teamId,
          delegateUserId: dto.delegateUserId,
        },
        include: { delegate: true },
      });
    } catch {
      throw new ConflictException('User is already a delegate for this team');
    }
  }

  async removeDelegate(teamId: string, userId: string, user: AuthUser) {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
    });

    if (user.role !== 'ADMIN' && team.ownerId !== user.id) {
      throw new ForbiddenException('Only the team owner or an admin can manage delegates');
    }

    const delegate = await this.prisma.statDelegate.findUnique({
      where: { teamId_delegateUserId: { teamId, delegateUserId: userId } },
    });

    if (!delegate) {
      throw new NotFoundException('Delegate not found');
    }

    await this.prisma.statDelegate.delete({
      where: { id: delegate.id },
    });

    return { success: true };
  }

  async listDelegates(teamId: string, user: AuthUser) {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
    });

    if (user.role !== 'ADMIN' && team.ownerId !== user.id) {
      throw new ForbiddenException('Only the team owner or an admin can view delegates');
    }

    return this.prisma.statDelegate.findMany({
      where: { teamId },
      include: { delegate: true },
    });
  }

  /** Check if a user is a delegate for a given team */
  async isDelegate(teamId: string, userId: string): Promise<boolean> {
    const delegate = await this.prisma.statDelegate.findUnique({
      where: { teamId_delegateUserId: { teamId, delegateUserId: userId } },
    });
    return !!delegate;
  }
}
