import { Module } from '@nestjs/common';
import { LeagueSettingsController } from './league-settings.controller';
import { LeagueSettingsService } from './league-settings.service';

@Module({
  controllers: [LeagueSettingsController],
  providers: [LeagueSettingsService],
  exports: [LeagueSettingsService],
})
export class LeagueSettingsModule {}
