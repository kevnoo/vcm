import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelMappingDto } from './dto/create-channel-mapping.dto';

@Injectable()
export class DiscordChannelService {
  constructor(private prisma: PrismaService) {}

  async findByCompetition(competitionId: string) {
    return this.prisma.discordChannelMapping.findMany({
      where: { competitionId },
    });
  }

  async upsert(dto: CreateChannelMappingDto) {
    const competition = await this.prisma.competition.findUnique({
      where: { id: dto.competitionId },
    });
    if (!competition) {
      throw new NotFoundException('Competition not found');
    }

    return this.prisma.discordChannelMapping.upsert({
      where: {
        competitionId_channelType: {
          competitionId: dto.competitionId,
          channelType: dto.channelType,
        },
      },
      update: {
        discordGuildId: dto.discordGuildId,
        discordChannelId: dto.discordChannelId,
      },
      create: {
        competitionId: dto.competitionId,
        discordGuildId: dto.discordGuildId,
        discordChannelId: dto.discordChannelId,
        channelType: dto.channelType,
      },
    });
  }

  async remove(competitionId: string, channelType: string) {
    return this.prisma.discordChannelMapping.delete({
      where: {
        competitionId_channelType: {
          competitionId,
          channelType: channelType as any,
        },
      },
    });
  }
}
