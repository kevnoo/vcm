import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PosService } from './pos.service';
import { PosCheckoutDto } from './dto/pos-checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin/pos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class PosController {
  constructor(private posService: PosService) {}

  @Post('checkout')
  checkout(@Body() dto: PosCheckoutDto) {
    return this.posService.checkout(dto);
  }
}
