import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ResultsService } from './results.service';
import { SubmitResultDto } from './dto/submit-result.dto';
import { DisputeResultDto } from './dto/dispute-result.dto';
import { ResolveResultDto } from './dto/resolve-result.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResultsController {
  constructor(private resultsService: ResultsService) {}

  @Post('matches/:matchId/result')
  submit(
    @Param('matchId') matchId: string,
    @Body() dto: SubmitResultDto,
    @CurrentUser() user: any,
  ) {
    return this.resultsService.submit(matchId, dto, user);
  }

  @Patch('results/:id/dispute')
  dispute(
    @Param('id') id: string,
    @Body() dto: DisputeResultDto,
    @CurrentUser() user: any,
  ) {
    return this.resultsService.dispute(id, dto, user);
  }

  @Patch('results/:id/resolve')
  @Roles('ADMIN')
  resolve(@Param('id') id: string, @Body() dto: ResolveResultDto) {
    return this.resultsService.resolve(id, dto);
  }

  @Patch('results/:id/confirm')
  @Roles('ADMIN')
  confirm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.resultsService.confirm(id, user.id);
  }

  @Get('admin/disputes')
  @Roles('ADMIN')
  findDisputed() {
    return this.resultsService.findDisputed();
  }
}
