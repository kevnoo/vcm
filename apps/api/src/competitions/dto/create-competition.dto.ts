import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateCompetitionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['DOUBLE_ROUND_ROBIN', 'SINGLE_ROUND_ROBIN', 'KNOCKOUT_CUP', 'PLAYOFF'])
  type: string;

  @IsObject()
  @IsOptional()
  config?: Record<string, unknown>;
}
