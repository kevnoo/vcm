import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateMatchDto } from './dto/update-match.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
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

  @Patch('matches/:id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateMatchDto) {
    return this.matchesService.update(id, dto);
  }
}
