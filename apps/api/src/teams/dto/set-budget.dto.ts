import { IsInt, Min } from 'class-validator';

export class SetBudgetDto {
  @IsInt()
  @Min(0)
  budget: number;
}
