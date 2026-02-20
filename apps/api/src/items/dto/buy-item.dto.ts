import { IsInt, IsUUID, Min } from 'class-validator';

export class BuyItemDto {
  @IsUUID()
  itemDefinitionId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
