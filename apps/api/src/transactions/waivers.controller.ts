import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { WaiversService } from './waivers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReleasePlayerDto } from './dto/release-player.dto';
import { PlaceWaiverBidDto } from './dto/place-waiver-bid.dto';
import type { User } from '../generated/prisma/client';

@Controller('waivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WaiversController {
  constructor(private waiversService: WaiversService) {}

  @Post()
  release(@Body() dto: ReleasePlayerDto, @CurrentUser() user: User) {
    return this.waiversService.release(dto.playerId, user);
  }

  @Get()
  findAll() {
    return this.waiversService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.waiversService.findById(id, user);
  }

  @Post(':id/bid')
  placeBid(
    @Param('id') id: string,
    @Body() dto: PlaceWaiverBidDto,
    @CurrentUser() user: User,
  ) {
    return this.waiversService.placeBid(id, dto.amount, user);
  }

  @Delete(':id/bid')
  withdrawBid(@Param('id') id: string, @CurrentUser() user: User) {
    return this.waiversService.withdrawBid(id, user);
  }

  @Post(':id/resolve')
  @Roles('ADMIN')
  resolve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.waiversService.resolve(id, user);
  }

  @Patch(':id/cancel')
  @Roles('ADMIN')
  cancel(@Param('id') id: string) {
    return this.waiversService.cancel(id);
  }
}
