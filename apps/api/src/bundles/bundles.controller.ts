import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BundlesService } from './bundles.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { BuyBundleDto } from './dto/buy-bundle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BundlesController {
  constructor(private bundlesService: BundlesService) {}

  // ─── Admin: Bundle CRUD ─────────────────────────────────

  @Get('admin/bundles')
  @Roles('ADMIN')
  findAll() {
    return this.bundlesService.findAll();
  }

  @Get('admin/bundles/:id')
  @Roles('ADMIN')
  findById(@Param('id') id: string) {
    return this.bundlesService.findById(id);
  }

  @Post('admin/bundles')
  @Roles('ADMIN')
  create(@Body() dto: CreateBundleDto) {
    return this.bundlesService.create(dto);
  }

  @Patch('admin/bundles/:id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateBundleDto) {
    return this.bundlesService.update(id, dto);
  }

  @Delete('admin/bundles/:id')
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.bundlesService.delete(id);
  }

  // ─── Shop: Active bundles ───────────────────────────────

  @Get('shop/bundles')
  findActive() {
    return this.bundlesService.findActive();
  }

  // ─── Team: Buy bundle ──────────────────────────────────

  @Post('teams/:teamId/bundles/buy')
  buyBundle(
    @Param('teamId') teamId: string,
    @Body() dto: BuyBundleDto,
    @CurrentUser() user: any,
  ) {
    return this.bundlesService.buyBundle(teamId, user.id, dto);
  }
}
