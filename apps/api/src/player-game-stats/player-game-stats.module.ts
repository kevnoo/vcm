import { Module } from '@nestjs/common';
import { PlayerGameStatsController } from './player-game-stats.controller';
import { PlayerGameStatsService } from './player-game-stats.service';
import { StatDelegatesModule } from '../stat-delegates/stat-delegates.module';

@Module({
  imports: [StatDelegatesModule],
  controllers: [PlayerGameStatsController],
  providers: [PlayerGameStatsService],
  exports: [PlayerGameStatsService],
})
export class PlayerGameStatsModule {}
