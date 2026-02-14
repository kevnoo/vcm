import { Injectable } from '@nestjs/common';
import { KnockoutGenerator } from './knockout.generator';

@Injectable()
export class PlayoffGenerator {
  constructor(private knockoutGenerator: KnockoutGenerator) {}

  /**
   * Playoff is a seeded knockout bracket.
   * Teams should be provided in seed order (1st seed first, etc.).
   */
  async generate(competitionId: string, teamIds: string[]) {
    return this.knockoutGenerator.generate(competitionId, teamIds);
  }
}
