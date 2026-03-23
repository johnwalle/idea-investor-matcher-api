import { IsString, IsOptional, IsObject, IsUUID } from 'class-validator';

export class SendNotificationDto {
  @IsUUID()
  userId: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsObject()
  data?: any; // Optional custom JSON data
}