import {
  IsString,
  IsUUID,
} from 'class-validator';

export class RegisterPushTokenDto {
    @IsUUID()
    userId: string;

    @IsString()
    token: string;
}
