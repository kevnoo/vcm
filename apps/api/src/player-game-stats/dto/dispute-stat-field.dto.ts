import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

class DisputeFieldEntry {
  @IsString()
  fieldName: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class DisputeStatFieldDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DisputeFieldEntry)
  fields: DisputeFieldEntry[];
}
