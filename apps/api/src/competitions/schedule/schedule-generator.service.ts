import { Injectable, BadRequestException } from '@nestjs/common';
import { RoundRobinGenerator } from './round-robin.generator';
import { KnockoutGenerator } from './knockout.generator';
import { PlayoffGenerator } from './playoff.generator';

@Injectable()
export class ScheduleGeneratorService {
  constructor(
    private roundRobinGenerator: RoundRobinGenerator,
    private knockoutGenerator: KnockoutGenerator,
    private playoffGenerator: PlayoffGenerator,
  ) {}

  async generate(competitionId: string, type: string, teamIds: string[]) {
    if (teamIds.length < 2) {
      throw new BadRequestException(
        'At least 2 teams are required to generate a schedule',
      );
    }

    switch (type) {
      case 'DOUBLE_ROUND_ROBIN':
        return this.roundRobinGenerator.generate(competitionId, teamIds, {
          legs: 2,
        });
      case 'SINGLE_ROUND_ROBIN':
        return this.roundRobinGenerator.generate(competitionId, teamIds, {
          legs: 1,
        });
      case 'KNOCKOUT_CUP':
        return this.knockoutGenerator.generate(competitionId, teamIds);
      case 'PLAYOFF':
        return this.playoffGenerator.generate(competitionId, teamIds);
      default:
        throw new BadRequestException(`Unknown competition type: ${type}`);
    }
  }
}
