import { Module } from '@nestjs/common';
import { CompetitionsController } from './competitions.controller';
import { CompetitionsService } from './competitions.service';
import { ScheduleGeneratorService } from './schedule/schedule-generator.service';
import { RoundRobinGenerator } from './schedule/round-robin.generator';
import { KnockoutGenerator } from './schedule/knockout.generator';
import { PlayoffGenerator } from './schedule/playoff.generator';

@Module({
  controllers: [CompetitionsController],
  providers: [
    CompetitionsService,
    ScheduleGeneratorService,
    RoundRobinGenerator,
    KnockoutGenerator,
    PlayoffGenerator,
  ],
  exports: [CompetitionsService],
})
export class CompetitionsModule {}
