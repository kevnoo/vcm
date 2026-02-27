import { IsEnum, IsString, IsUUID } from 'class-validator';

enum DiscordChannelType {
  SCHEDULE = 'SCHEDULE',
  RESULTS = 'RESULTS',
  TRANSACTIONS = 'TRANSACTIONS',
  MEDIA = 'MEDIA',
}

export class CreateChannelMappingDto {
  @IsUUID()
  competitionId: string;

  @IsString()
  discordGuildId: string;

  @IsString()
  discordChannelId: string;

  @IsEnum(DiscordChannelType)
  channelType: DiscordChannelType;
}
