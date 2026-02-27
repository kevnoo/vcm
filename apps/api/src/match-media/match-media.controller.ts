import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MatchMediaService } from './match-media.service';
import { CreateMatchMediaDto } from './dto/create-match-media.dto';

@Controller('match-media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchMediaController {
  constructor(private mediaService: MatchMediaService) {}

  @Get(':matchId')
  findByMatch(@Param('matchId') matchId: string) {
    return this.mediaService.findByMatch(matchId);
  }

  @Post()
  create(@Body() dto: CreateMatchMediaDto, @CurrentUser() user: any) {
    return this.mediaService.create(dto, user);
  }

  @Delete(':mediaId')
  remove(@Param('mediaId') mediaId: string, @CurrentUser() user: any) {
    return this.mediaService.remove(mediaId, user);
  }
}
