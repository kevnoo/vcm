import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSkillGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
