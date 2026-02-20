import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { GameStatsService } from './game-stats.service';
import { SaveLineupDto } from './dto/save-lineup.dto';
import { SaveSubstitutionsDto } from './dto/save-substitutions.dto';
import { SavePlayerStatsDto } from './dto/save-player-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class GameStatsController {
  constructor(private gameStatsService: GameStatsService) {}

  @Get('matches/:matchId/stats')
  getMatchStats(@Param('matchId') matchId: string) {
    return this.gameStatsService.getMatchStats(matchId);
  }

  @Put('matches/:matchId/stats/lineup/:teamId')
  saveLineup(
    @Param('matchId') matchId: string,
    @Param('teamId') teamId: string,
    @Body() dto: SaveLineupDto,
    @CurrentUser() user: any,
  ) {
    return this.gameStatsService.saveLineup(matchId, teamId, dto, user);
  }

  @Put('matches/:matchId/stats/substitutions/:teamId')
  saveSubstitutions(
    @Param('matchId') matchId: string,
    @Param('teamId') teamId: string,
    @Body() dto: SaveSubstitutionsDto,
    @CurrentUser() user: any,
  ) {
    return this.gameStatsService.saveSubstitutions(
      matchId,
      teamId,
      dto,
      user,
    );
  }

  @Put('matches/:matchId/stats/player-stats')
  savePlayerStats(
    @Param('matchId') matchId: string,
    @Body() dto: SavePlayerStatsDto,
    @CurrentUser() user: any,
  ) {
    return this.gameStatsService.savePlayerStats(matchId, dto, user);
  }
}
