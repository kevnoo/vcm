import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlayersService } from './players.service';
import { PlayerValueService } from './player-value.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { SetPlayerSkillsDto } from './dto/set-player-skills.dto';
import { AssignPlayerRolesDto } from './dto/assign-player-roles.dto';
import { AssignPlayerPlayStylesDto } from './dto/assign-player-play-styles.dto';
import { SetPlayerPositionsDto } from './dto/set-player-positions.dto';
import type { Position } from '../generated/prisma/client';

@Controller('players')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlayersController {
  constructor(
    private playersService: PlayersService,
    private playerValueService: PlayerValueService,
  ) {}

  @Get()
  findAll(
    @Query('teamId') teamId?: string,
    @Query('position') position?: Position,
    @Query('freeAgents') freeAgents?: string,
  ) {
    return this.playersService.findAll({
      teamId,
      position,
      freeAgents: freeAgents === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playersService.findById(id);
  }

  @Get(':id/value')
  getValue(@Param('id') id: string) {
    return this.playerValueService.computeValue(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreatePlayerDto) {
    return this.playersService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdatePlayerDto) {
    return this.playersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.playersService.delete(id);
  }

  @Put(':id/skills')
  @Roles('ADMIN')
  setSkills(@Param('id') id: string, @Body() dto: SetPlayerSkillsDto) {
    return this.playersService.setSkills(id, dto);
  }

  @Put(':id/roles')
  @Roles('ADMIN')
  assignRoles(@Param('id') id: string, @Body() dto: AssignPlayerRolesDto) {
    return this.playersService.assignRoles(id, dto);
  }

  @Put(':id/play-styles')
  @Roles('ADMIN')
  assignPlayStyles(@Param('id') id: string, @Body() dto: AssignPlayerPlayStylesDto) {
    return this.playersService.assignPlayStyles(id, dto);
  }

  @Put(':id/positions')
  @Roles('ADMIN')
  setPositions(@Param('id') id: string, @Body() dto: SetPlayerPositionsDto) {
    return this.playersService.setPositions(id, dto);
  }
}
