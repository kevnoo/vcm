import { IsNotEmpty, IsString, MaxLength, IsOptional, IsArray } from 'class-validator';

export class CreateMatchMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}
