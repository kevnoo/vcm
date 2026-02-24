import { Module } from '@nestjs/common';
import { StatDelegatesController } from './stat-delegates.controller';
import { StatDelegatesService } from './stat-delegates.service';

@Module({
  controllers: [StatDelegatesController],
  providers: [StatDelegatesService],
  exports: [StatDelegatesService],
})
export class StatDelegatesModule {}
