import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TradesService } from './trades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTradeOfferDto } from './dto/create-trade-offer.dto';
import { RespondTradeOfferDto } from './dto/respond-trade-offer.dto';
import { CounterTradeOfferDto } from './dto/counter-trade-offer.dto';
import { AdminTradeActionDto } from './dto/admin-trade-action.dto';
import type { User } from '../generated/prisma/client';

@Controller('trades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TradesController {
  constructor(private tradesService: TradesService) {}

  @Post()
  create(@Body() dto: CreateTradeOfferDto, @CurrentUser() user: User) {
    return this.tradesService.create(dto, user);
  }

  @Get()
  findAll(@Query('status') status?: string, @Query('teamId') teamId?: string) {
    return this.tradesService.findAll({ status, teamId });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.tradesService.findById(id);
  }

  @Patch(':id/accept')
  accept(
    @Param('id') id: string,
    @Body() dto: RespondTradeOfferDto,
    @CurrentUser() user: User,
  ) {
    return this.tradesService.accept(id, user, dto.responseNote);
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RespondTradeOfferDto,
    @CurrentUser() user: User,
  ) {
    return this.tradesService.reject(id, user, dto.responseNote);
  }

  @Post(':id/counter')
  counter(
    @Param('id') id: string,
    @Body() dto: CounterTradeOfferDto,
    @CurrentUser() user: User,
  ) {
    return this.tradesService.counter(id, dto, user);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tradesService.cancel(id, user);
  }

  @Patch(':id/approve')
  @Roles('ADMIN')
  approve(
    @Param('id') id: string,
    @Body() dto: AdminTradeActionDto,
    @CurrentUser() user: User,
  ) {
    return this.tradesService.approve(id, user, dto.adminNote);
  }

  @Patch(':id/deny')
  @Roles('ADMIN')
  deny(
    @Param('id') id: string,
    @Body() dto: AdminTradeActionDto,
    @CurrentUser() user: User,
  ) {
    return this.tradesService.deny(id, user, dto.adminNote);
  }
}

@Controller('admin/pending-trades')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPendingTradesController {
  constructor(private tradesService: TradesService) {}

  @Get()
  findPendingApproval() {
    return this.tradesService.findPendingApproval();
  }
}
