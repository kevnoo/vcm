import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { AddTeamsDto } from './dto/add-teams.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('competitions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompetitionsController {
  constructor(private competitionsService: CompetitionsService) {}

  @Get()
  findAll() {
    return this.competitionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.competitionsService.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateCompetitionDto) {
    return this.competitionsService.create(dto);
  }

  @Post(':id/teams')
  @Roles('ADMIN')
  addTeams(@Param('id') id: string, @Body() dto: AddTeamsDto) {
    return this.competitionsService.addTeams(id, dto);
  }

  @Delete(':id/teams/:teamId')
  @Roles('ADMIN')
  removeTeam(@Param('id') id: string, @Param('teamId') teamId: string) {
    return this.competitionsService.removeTeam(id, teamId);
  }

  @Post(':id/generate-schedule')
  @Roles('ADMIN')
  generateSchedule(@Param('id') id: string) {
    return this.competitionsService.generateSchedule(id);
  }

  @Post(':id/activate')
  @Roles('ADMIN')
  activate(@Param('id') id: string) {
    return this.competitionsService.activate(id);
  }
}
