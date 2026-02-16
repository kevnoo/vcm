import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TransactionHistoryService } from './transaction-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionHistoryController {
  constructor(private transactionHistoryService: TransactionHistoryService) {}

  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('teamId') teamId?: string,
    @Query('playerId') playerId?: string,
  ) {
    return this.transactionHistoryService.findAll({ type, teamId, playerId });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.transactionHistoryService.findById(id);
  }
}
