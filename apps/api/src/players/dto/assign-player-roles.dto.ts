import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsUUID, ValidateNested } from 'class-validator';
import { RoleLevel } from '../../generated/prisma/client';

class RoleAssignmentDto {
  @IsUUID()
  playerRoleDefinitionId: string;

  @IsEnum(RoleLevel)
  level: RoleLevel;
}

export class AssignPlayerRolesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleAssignmentDto)
  roles: RoleAssignmentDto[];
}
