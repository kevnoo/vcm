import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CsvImportService } from './csv-import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin/csv')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CsvImportController {
  constructor(private csvImportService: CsvImportService) {}

  /** List all available CSV templates */
  @Get('templates')
  getTemplates() {
    return this.csvImportService.getTemplates();
  }

  /** Download a CSV template file with headers and sample data */
  @Get('templates/:type/download')
  downloadTemplate(@Param('type') type: string, @Res() res: Response) {
    const csv = this.csvImportService.getTemplateCsv(type);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="vcm-template-${type}.csv"`,
    );
    res.send(csv);
  }

  /** Upload and import a CSV file for the given template type */
  @Post('import/:type')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        if (
          file.mimetype === 'text/csv' ||
          file.mimetype === 'application/vnd.ms-excel' ||
          file.originalname.endsWith('.csv')
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only CSV files are allowed'), false);
        }
      },
    }),
  )
  async importCsv(
    @Param('type') type: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const content = file.buffer.toString('utf-8');
    return this.csvImportService.importCsv(type, content);
  }
}
