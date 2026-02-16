import { Module } from '@nestjs/common';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { PlayerValueService } from './player-value.service';

@Module({
  controllers: [PlayersController],
  providers: [PlayersService, PlayerValueService],
  exports: [PlayersService, PlayerValueService],
})
export class PlayersModule {}
