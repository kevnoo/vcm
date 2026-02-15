import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReferenceDataService } from './reference-data.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateSkillGroupDto } from './dto/create-skill-group.dto';
import { UpdateSkillGroupDto } from './dto/update-skill-group.dto';
import { CreateSkillDefinitionDto } from './dto/create-skill-definition.dto';
import { UpdateSkillDefinitionDto } from './dto/update-skill-definition.dto';
import { CreatePlayerRoleDefinitionDto } from './dto/create-player-role-definition.dto';
import { UpdatePlayerRoleDefinitionDto } from './dto/update-player-role-definition.dto';
import { CreatePlayStyleDefinitionDto } from './dto/create-play-style-definition.dto';
import { UpdatePlayStyleDefinitionDto } from './dto/update-play-style-definition.dto';
import type { Position } from '../generated/prisma/client';

@Controller('reference-data')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReferenceDataController {
  constructor(private referenceDataService: ReferenceDataService) {}

  // ─── Skill Groups ──────────────────────────────────────
  @Get('skill-groups')
  findAllSkillGroups() {
    return this.referenceDataService.findAllSkillGroups();
  }

  @Post('skill-groups')
  @Roles('ADMIN')
  createSkillGroup(@Body() dto: CreateSkillGroupDto) {
    return this.referenceDataService.createSkillGroup(dto);
  }

  @Patch('skill-groups/:id')
  @Roles('ADMIN')
  updateSkillGroup(@Param('id') id: string, @Body() dto: UpdateSkillGroupDto) {
    return this.referenceDataService.updateSkillGroup(id, dto);
  }

  @Delete('skill-groups/:id')
  @Roles('ADMIN')
  deleteSkillGroup(@Param('id') id: string) {
    return this.referenceDataService.deleteSkillGroup(id);
  }

  // ─── Skill Definitions ────────────────────────────────
  @Post('skills')
  @Roles('ADMIN')
  createSkillDefinition(@Body() dto: CreateSkillDefinitionDto) {
    return this.referenceDataService.createSkillDefinition(dto);
  }

  @Patch('skills/:id')
  @Roles('ADMIN')
  updateSkillDefinition(@Param('id') id: string, @Body() dto: UpdateSkillDefinitionDto) {
    return this.referenceDataService.updateSkillDefinition(id, dto);
  }

  @Delete('skills/:id')
  @Roles('ADMIN')
  deleteSkillDefinition(@Param('id') id: string) {
    return this.referenceDataService.deleteSkillDefinition(id);
  }

  // ─── Player Role Definitions ──────────────────────────
  @Get('player-roles')
  findAllPlayerRoles(@Query('position') position?: Position) {
    return this.referenceDataService.findAllPlayerRoles(position);
  }

  @Post('player-roles')
  @Roles('ADMIN')
  createPlayerRole(@Body() dto: CreatePlayerRoleDefinitionDto) {
    return this.referenceDataService.createPlayerRole(dto);
  }

  @Patch('player-roles/:id')
  @Roles('ADMIN')
  updatePlayerRole(@Param('id') id: string, @Body() dto: UpdatePlayerRoleDefinitionDto) {
    return this.referenceDataService.updatePlayerRole(id, dto);
  }

  @Delete('player-roles/:id')
  @Roles('ADMIN')
  deletePlayerRole(@Param('id') id: string) {
    return this.referenceDataService.deletePlayerRole(id);
  }

  // ─── Play Style Definitions ───────────────────────────
  @Get('play-styles')
  findAllPlayStyles(@Query('position') position?: Position) {
    return this.referenceDataService.findAllPlayStyles(position);
  }

  @Post('play-styles')
  @Roles('ADMIN')
  createPlayStyle(@Body() dto: CreatePlayStyleDefinitionDto) {
    return this.referenceDataService.createPlayStyle(dto);
  }

  @Patch('play-styles/:id')
  @Roles('ADMIN')
  updatePlayStyle(@Param('id') id: string, @Body() dto: UpdatePlayStyleDefinitionDto) {
    return this.referenceDataService.updatePlayStyle(id, dto);
  }

  @Delete('play-styles/:id')
  @Roles('ADMIN')
  deletePlayStyle(@Param('id') id: string) {
    return this.referenceDataService.deletePlayStyle(id);
  }
}
