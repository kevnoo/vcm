import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';
import { AuthService } from './auth.service';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(
    private authService: AuthService,
    config: ConfigService,
  ) {
    super({
      clientID: config.get<string>('DISCORD_CLIENT_ID'),
      clientSecret: config.get<string>('DISCORD_CLIENT_SECRET'),
      callbackURL: config.get<string>('DISCORD_CALLBACK_URL'),
      scope: ['identify'],
    } as any);
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return this.authService.validateDiscordUser({
      id: profile.id,
      username: profile.username,
      avatar: profile.avatar,
    });
  }
}
