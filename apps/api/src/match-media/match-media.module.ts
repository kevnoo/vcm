import { Module } from '@nestjs/common';
import { MatchMediaController } from './match-media.controller';
import { MatchMediaService } from './match-media.service';

@Module({
  controllers: [MatchMediaController],
  providers: [MatchMediaService],
  exports: [MatchMediaService],
})
export class MatchMediaModule {}
