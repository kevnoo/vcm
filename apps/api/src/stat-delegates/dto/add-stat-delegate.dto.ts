import { IsString } from 'class-validator';

export class AddStatDelegateDto {
  @IsString()
  delegateUserId: string;
}
