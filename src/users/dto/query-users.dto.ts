// src/modules/users/dto/query-users.dto.ts
import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class QueryUsersDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  isActive?: boolean;
}
