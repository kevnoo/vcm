import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchSchedulingController } from './match-scheduling.controller';
import { MatchSchedulingService } from './match-scheduling.service';
import { DiscordThreadService } from './discord-thread.service';

@Module({
  controllers: [MatchesController, MatchSchedulingController],
  providers: [MatchesService, MatchSchedulingService, DiscordThreadService],
  exports: [MatchesService],
})
export class MatchesModule {}
