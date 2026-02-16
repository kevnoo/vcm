import { Module } from '@nestjs/common';
import { TradesController, AdminPendingTradesController } from './trades.controller';
import { TradesService } from './trades.service';
import { FreeAgencyController } from './free-agency.controller';
import { FreeAgencyService } from './free-agency.service';
import { WaiversController } from './waivers.controller';
import { WaiversService } from './waivers.service';
import { TransactionHistoryController } from './transaction-history.controller';
import { TransactionHistoryService } from './transaction-history.service';
import { LeagueSettingsModule } from '../league-settings/league-settings.module';
import { PlayersModule } from '../players/players.module';

@Module({
  imports: [LeagueSettingsModule, PlayersModule],
  controllers: [
    TradesController,
    AdminPendingTradesController,
    FreeAgencyController,
    WaiversController,
    TransactionHistoryController,
  ],
  providers: [TradesService, FreeAgencyService, WaiversService, TransactionHistoryService],
})
export class TransactionsModule {}
