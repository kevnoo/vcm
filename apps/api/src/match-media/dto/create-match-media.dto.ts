import { IsEnum, IsOptional, IsString, IsUUID, IsUrl } from 'class-validator';

enum MediaType {
  SCREENSHOT = 'SCREENSHOT',
  VIDEO = 'VIDEO',
  REPLAY = 'REPLAY',
}

export class CreateMatchMediaDto {
  @IsUUID()
  matchId: string;

  @IsString()
  url: string;

  @IsEnum(MediaType)
  mediaType: MediaType;

  @IsOptional()
  @IsString()
  discordMessageId?: string;

  @IsOptional()
  @IsString()
  caption?: string;
}
