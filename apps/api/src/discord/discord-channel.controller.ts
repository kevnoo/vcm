import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DiscordChannelService } from './discord-channel.service';
import { CreateChannelMappingDto } from './dto/create-channel-mapping.dto';

@Controller('discord/channels')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class DiscordChannelController {
  constructor(private channelService: DiscordChannelService) {}

  @Get(':competitionId')
  findByCompetition(@Param('competitionId') competitionId: string) {
    return this.channelService.findByCompetition(competitionId);
  }

  @Post()
  upsert(@Body() dto: CreateChannelMappingDto) {
    return this.channelService.upsert(dto);
  }

  @Delete(':competitionId/:channelType')
  remove(
    @Param('competitionId') competitionId: string,
    @Param('channelType') channelType: string,
  ) {
    return this.channelService.remove(competitionId, channelType);
  }
}
