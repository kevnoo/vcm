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
import { ItemsService } from './items.service';
import { CreateItemDefinitionDto } from './dto/create-item-definition.dto';
import { UpdateItemDefinitionDto } from './dto/update-item-definition.dto';
import { BuyItemDto } from './dto/buy-item.dto';
import { UseItemDto } from './dto/use-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  // ─── Admin: Item Definition CRUD ──────────────────────

  @Get('admin/items')
  @Roles('ADMIN')
  findAllDefinitions() {
    return this.itemsService.findAllDefinitions();
  }

  @Post('admin/items')
  @Roles('ADMIN')
  createDefinition(@Body() dto: CreateItemDefinitionDto) {
    return this.itemsService.createDefinition(dto);
  }

  @Patch('admin/items/:id')
  @Roles('ADMIN')
  updateDefinition(@Param('id') id: string, @Body() dto: UpdateItemDefinitionDto) {
    return this.itemsService.updateDefinition(id, dto);
  }

  @Delete('admin/items/:id')
  @Roles('ADMIN')
  deleteDefinition(@Param('id') id: string) {
    return this.itemsService.deleteDefinition(id);
  }

  // ─── Shop: Browse active items ────────────────────────

  @Get('shop/items')
  findActiveItems() {
    return this.itemsService.findActiveDefinitions();
  }

  // ─── Team Items: Buy, View Inventory, Use ─────────────

  @Get('teams/:teamId/items')
  findTeamItems(@Param('teamId') teamId: string) {
    return this.itemsService.findTeamItems(teamId);
  }

  @Post('teams/:teamId/items/buy')
  buyItem(
    @Param('teamId') teamId: string,
    @Body() dto: BuyItemDto,
    @CurrentUser() user: any,
  ) {
    return this.itemsService.buyItem(teamId, user.id, dto);
  }

  @Post('items/use')
  useItem(@Body() dto: UseItemDto, @CurrentUser() user: any) {
    return this.itemsService.useItem(user.id, dto);
  }

  @Get('teams/:teamId/items/history')
  findTeamUsageHistory(@Param('teamId') teamId: string) {
    return this.itemsService.findTeamUsageHistory(teamId);
  }
}
