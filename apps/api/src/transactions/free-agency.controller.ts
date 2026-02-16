import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { FreeAgencyService } from './free-agency.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClaimFreeAgentDto } from './dto/claim-free-agent.dto';
import type { User } from '../generated/prisma/client';

@Controller('free-agency')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FreeAgencyController {
  constructor(private freeAgencyService: FreeAgencyService) {}

  @Get()
  findFreeAgents() {
    return this.freeAgencyService.findFreeAgents();
  }

  @Post(':playerId/claim')
  claim(
    @Param('playerId') playerId: string,
    @Body() dto: ClaimFreeAgentDto,
    @CurrentUser() user: User,
  ) {
    return this.freeAgencyService.claim(playerId, user, dto.teamId);
  }

  @Post(':playerId/add')
  @Roles('ADMIN')
  adminAdd(@Param('playerId') playerId: string) {
    return this.freeAgencyService.adminAdd(playerId);
  }

  @Delete(':playerId/remove')
  @Roles('ADMIN')
  adminRemove(@Param('playerId') playerId: string, @Query('teamId') teamId: string) {
    return this.freeAgencyService.adminRemove(playerId, teamId);
  }
}
