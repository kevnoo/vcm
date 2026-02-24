import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

interface DiscordProfile {
  id: string;
  username: string;
  avatar: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateDiscordUser(profile: DiscordProfile) {
    // 1. Look up by real Discord ID (existing users who have logged in)
    let user = await this.prisma.user.findUnique({
      where: { discordId: profile.id },
    });

    if (!user) {
      // 2. Check for a placeholder user with matching discordUsername
      const placeholder = await this.prisma.user.findFirst({
        where: {
          discordUsername: profile.username,
          discordId: { startsWith: 'placeholder:' },
        },
      });

      if (placeholder) {
        // 3. Merge: update placeholder with real Discord identity
        user = await this.prisma.user.update({
          where: { id: placeholder.id },
          data: {
            discordId: profile.id,
            discordUsername: profile.username,
            discordAvatar: profile.avatar,
          },
        });
      } else {
        // 4. Brand new user — create from scratch
        user = await this.prisma.user.create({
          data: {
            discordId: profile.id,
            discordUsername: profile.username,
            discordAvatar: profile.avatar,
            role: 'OWNER',
          },
        });
      }
    } else {
      // Existing user — refresh profile fields
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          discordUsername: profile.username,
          discordAvatar: profile.avatar,
        },
      });
    }

    return user;
  }

  generateJwt(user: { id: string; role: string }) {
    return this.jwtService.sign({ sub: user.id, role: user.role });
  }
}
