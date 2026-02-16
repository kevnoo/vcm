import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeagueSettingsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.leagueSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async findByKey(key: string) {
    const setting = await this.prisma.leagueSetting.findUnique({ where: { key } });
    if (!setting) throw new NotFoundException(`Setting "${key}" not found`);
    return setting;
  }

  upsert(key: string, value: string) {
    return this.prisma.leagueSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async delete(key: string) {
    await this.findByKey(key);
    return this.prisma.leagueSetting.delete({ where: { key } });
  }

  async getWaiverPeriodDays(): Promise<number> {
    const setting = await this.prisma.leagueSetting.findUnique({ where: { key: 'waiver_period_days' } });
    return setting ? parseInt(setting.value, 10) : 3;
  }

  async getTradeOfferExpiryDays(): Promise<number> {
    const setting = await this.prisma.leagueSetting.findUnique({ where: { key: 'trade_offer_expiry_days' } });
    return setting ? parseInt(setting.value, 10) : 7;
  }

  async getFreeAgencyCostPercent(): Promise<number> {
    const setting = await this.prisma.leagueSetting.findUnique({ where: { key: 'free_agency_cost_percent' } });
    return setting ? parseInt(setting.value, 10) : 50;
  }
}
