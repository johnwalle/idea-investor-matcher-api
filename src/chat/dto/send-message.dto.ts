// src/modules/chat/dto/send-message.dto.ts
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  roomId: string;

  @IsUUID()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}