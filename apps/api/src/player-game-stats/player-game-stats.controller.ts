import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlayerGameStatsService } from './player-game-stats.service';
import { SubmitGameStatsDto } from './dto/submit-game-stats.dto';
import { ConfirmGameStatsDto } from './dto/confirm-game-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
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
}
