import { resolve } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { CompetitionsModule } from './competitions/competitions.module';
import { MatchesModule } from './matches/matches.module';
import { ResultsModule } from './results/results.module';
import { ReferenceDataModule } from './reference-data/reference-data.module';
import { PlayersModule } from './players/players.module';
import { LeagueSettingsModule } from './league-settings/league-settings.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ItemsModule } from './items/items.module';
import { BundlesModule } from './bundles/bundles.module';
import { PosModule } from './pos/pos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(__dirname, '..', '..', '..', '.env'),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TeamsModule,
    CompetitionsModule,
    MatchesModule,
    ResultsModule,
    ReferenceDataModule,
    PlayersModule,
    LeagueSettingsModule,
    TransactionsModule,
    ItemsModule,
    BundlesModule,
    PosModule,
  ],
})
export class AppModule {}
