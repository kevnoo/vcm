import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Get('competitions/:competitionId/matches')
  findByCompetition(@Param('competitionId') competitionId: string) {
    return this.matchesService.findByCompetition(competitionId);
  }

  @Get('matches/:id')
  findOne(@Param('id') id: string) {
    return this.matchesService.findById(id);
  }
}
