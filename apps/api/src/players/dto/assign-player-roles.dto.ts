import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsUUID, ValidateNested } from 'class-validator';
import { Position, RoleLevel } from '../../generated/prisma/client';

class RoleAssignmentDto {
  @IsUUID()
  playerRoleDefinitionId: string;

  @IsEnum(RoleLevel)
  level: RoleLevel;
}

class PositionRolesDto {
  @IsEnum(Position)
  position: Position;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleAssignmentDto)
  roles: RoleAssignmentDto[];
}

export class AssignPlayerRolesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PositionRolesDto)
  positionRoles: PositionRolesDto[];
}
