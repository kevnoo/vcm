import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StatDelegatesService } from './stat-delegates.service';
import { AddStatDelegateDto } from './dto/add-stat-delegate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('teams/:teamId/delegates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatDelegatesController {
  constructor(private statDelegatesService: StatDelegatesService) {}

  @Post()
  add(
    @Param('teamId') teamId: string,
    @Body() dto: AddStatDelegateDto,
    @CurrentUser() user: any,
  ) {
    return this.statDelegatesService.addDelegate(teamId, dto, user);
  }

  @Delete(':userId')
  remove(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    return this.statDelegatesService.removeDelegate(teamId, userId, user);
  }

  @Get()
  list(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
  ) {
    return this.statDelegatesService.listDelegates(teamId, user);
  }
}
