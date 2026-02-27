import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlayerGameStatsService } from './player-game-stats.service';
import { SubmitGameStatsDto } from './dto/submit-game-stats.dto';
import { ConfirmGameStatsDto } from './dto/confirm-game-stats.dto';
import { DisputeStatFieldDto } from './dto/dispute-stat-field.dto';
import { ResolveStatDisputeDto } from './dto/resolve-stat-dispute.dto';
import { UpdateGameStatsDto } from './dto/update-game-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlayerGameStatsController {
  constructor(private service: PlayerGameStatsService) {}

  @Get('matches/:matchId/game-stats')
  getMatchGameStats(@Param('matchId') matchId: string) {
    return this.service.getMatchGameStats(matchId);
  }

  @Post('matches/:matchId/game-stats')
  submit(
    @Param('matchId') matchId: string,
    @Body() dto: SubmitGameStatsDto,
    @CurrentUser() user: any,
  ) {
    return this.service.submit(matchId, dto, user);
  }

  @Patch('matches/:matchId/game-stats/confirm')
  confirm(
    @Param('matchId') matchId: string,
    @Body() dto: ConfirmGameStatsDto,
    @CurrentUser() user: any,
  ) {
    return this.service.confirm(matchId, dto, user);
  }

  @Patch('game-stats/:id')
  updateGameStats(
    @Param('id') id: string,
    @Body() dto: UpdateGameStatsDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateGameStats(id, dto, user);
  }

  @Post('game-stats/:id/disputes')
  disputeFields(
    @Param('id') id: string,
    @Body() dto: DisputeStatFieldDto,
    @CurrentUser() user: any,
  ) {
    return this.service.disputeFields(id, dto, user);
  }

  @Patch('stat-disputes/:id/resolve')
  @Roles('ADMIN')
  resolveDispute(
    @Param('id') id: string,
    @Body() dto: ResolveStatDisputeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveDispute(id, dto, user.id);
  }

  @Get('admin/stat-disputes')
  @Roles('ADMIN')
  findOpenDisputes() {
    return this.service.findOpenDisputes();
  }

  @Get('players/:playerId/stats/season')
  getPlayerSeasonStats(
    @Param('playerId') playerId: string,
    @Query('competitionId') competitionId: string,
  ) {
    return this.service.getPlayerSeasonStats(playerId, competitionId);
  }

  @Get('players/:playerId/stats/career')
  getPlayerCareerStats(@Param('playerId') playerId: string) {
    return this.service.getPlayerCareerStats(playerId);
  }

  @Get('competitions/:competitionId/stats/leaders')
  getCompetitionLeaders(@Param('competitionId') competitionId: string) {
    return this.service.getCompetitionLeaders(competitionId);
  }
}
