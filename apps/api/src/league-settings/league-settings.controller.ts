import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { LeagueSettingsService } from './league-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UpsertLeagueSettingDto } from './dto/upsert-league-setting.dto';

@Controller('league-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeagueSettingsController {
  constructor(private leagueSettingsService: LeagueSettingsService) {}

  @Get()
  findAll() {
    return this.leagueSettingsService.findAll();
  }

  @Get(':key')
  findByKey(@Param('key') key: string) {
    return this.leagueSettingsService.findByKey(key);
  }

  @Put(':key')
  @Roles('ADMIN')
  upsert(@Param('key') key: string, @Body() dto: UpsertLeagueSettingDto) {
    return this.leagueSettingsService.upsert(key, dto.value);
  }

  @Delete(':key')
  @Roles('ADMIN')
  delete(@Param('key') key: string) {
    return this.leagueSettingsService.delete(key);
  }
}
