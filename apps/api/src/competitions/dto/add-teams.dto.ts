import { ArrayMinSize, IsUUID } from 'class-validator';

export class AddTeamsDto {
  @IsUUID('4', { each: true })
  @ArrayMinSize(2)
  teamIds: string[];
}
