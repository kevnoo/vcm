import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchMediaDto } from './dto/create-match-media.dto';

interface AuthUser {
  id: string;
  role: string;
}

@Injectable()
export class MatchMediaService {
  constructor(private prisma: PrismaService) {}

  async findByMatch(matchId: string) {
    return this.prisma.matchMedia.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
      include: { uploadedBy: { select: { id: true, discordUsername: true } } },
    });
  }

  async create(dto: CreateMatchMediaDto, user: AuthUser) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: dto.matchId },
      include: { homeTeam: true, awayTeam: true },
    });

    const isAdmin = user.role === 'ADMIN';
    const isInvolved =
      match.homeTeam.ownerId === user.id || match.awayTeam.ownerId === user.id;

    if (!isAdmin && !isInvolved) {
      throw new ForbiddenException('You are not involved in this match');
    }

    return this.prisma.matchMedia.create({
      data: {
        matchId: dto.matchId,
        url: dto.url,
        mediaType: dto.mediaType as any,
        discordMessageId: dto.discordMessageId ?? null,
        caption: dto.caption ?? null,
        uploadedById: user.id,
      },
    });
  }

  async remove(mediaId: string, user: AuthUser) {
    const media = await this.prisma.matchMedia.findUniqueOrThrow({
      where: { id: mediaId },
      include: {
        match: { include: { homeTeam: true, awayTeam: true } },
      },
    });

    const isAdmin = user.role === 'ADMIN';
    const isUploader = media.uploadedById === user.id;

    if (!isAdmin && !isUploader) {
      throw new ForbiddenException('You can only delete your own media');
    }

    return this.prisma.matchMedia.delete({ where: { id: mediaId } });
  }
}
