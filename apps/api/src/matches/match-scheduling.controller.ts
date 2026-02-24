import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MatchSchedulingService } from './match-scheduling.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateMatchMessageDto } from './dto/create-match-message.dto';
import { CreateTimeProposalDto } from './dto/create-time-proposal.dto';
import { RespondTimeProposalDto } from './dto/respond-time-proposal.dto';

@Controller('matches/:matchId/scheduling')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchSchedulingController {
  constructor(private schedulingService: MatchSchedulingService) {}

  @Get()
  getHub(@Param('matchId') matchId: string, @CurrentUser() user: any) {
    return this.schedulingService.getMatchHub(matchId, user);
  }

  @Get('messages')
  getMessages(@Param('matchId') matchId: string, @CurrentUser() user: any) {
    return this.schedulingService.getMessages(matchId, user);
  }

  @Post('messages')
  createMessage(
    @Param('matchId') matchId: string,
    @Body() dto: CreateMatchMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.schedulingService.createMessage(matchId, dto, user);
  }

  @Post('time-proposals')
  proposeTime(
    @Param('matchId') matchId: string,
    @Body() dto: CreateTimeProposalDto,
    @CurrentUser() user: any,
  ) {
    return this.schedulingService.proposeTime(matchId, dto, user);
  }

  @Patch('time-proposals/:proposalId')
  respondToProposal(
    @Param('proposalId') proposalId: string,
    @Body() dto: RespondTimeProposalDto,
    @CurrentUser() user: any,
  ) {
    return this.schedulingService.respondToProposal(proposalId, dto, user);
  }

  @Patch('set-time')
  @Roles('ADMIN')
  setMatchTime(
    @Param('matchId') matchId: string,
    @Body() dto: CreateTimeProposalDto,
    @CurrentUser() user: any,
  ) {
    return this.schedulingService.setMatchTime(
      matchId,
      dto.proposedTime,
      user,
    );
  }
}
