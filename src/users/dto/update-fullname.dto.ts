// src/modules/users/dto/update-fullname.dto.ts
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class UpdateFullNameDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  fullName: string;
}