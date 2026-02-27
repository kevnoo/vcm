import { Global, Module } from '@nestjs/common';
import { DiscordWebhookService } from './discord-webhook.service';
import { DiscordChannelService } from './discord-channel.service';
import { DiscordChannelController } from './discord-channel.controller';

@Global()
@Module({
  controllers: [DiscordChannelController],
  providers: [DiscordWebhookService, DiscordChannelService],
  exports: [DiscordWebhookService, DiscordChannelService],
})
export class DiscordModule {}
