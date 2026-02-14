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
    let user = await this.prisma.user.findUnique({
      where: { discordId: profile.id },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          discordId: profile.id,
          discordUsername: profile.username,
          discordAvatar: profile.avatar,
          role: 'OWNER',
        },
      });
    } else {
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
