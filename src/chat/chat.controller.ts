// src/modules/chat/chat.controller.ts
import {
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // get all my chat rooms with last message preview
  @Get('rooms')
  getMyRooms(@Req() req) {
    return this.chatService.getMyRooms(req.user.userId);
  }

  // get all messages in a room + mark them as read
  @Get('rooms/:roomId/messages')
  getRoomMessages(@Param('roomId') roomId: string, @Req() req) {
    return this.chatService.getRoomMessages(roomId, req.user.userId);
  }

  // get all my notifications
  @Get('notifications')
  getNotifications(@Req() req) {
    return this.chatService.getMyNotifications(req.user.userId);
  }

  // mark all notifications as read
  @Patch('notifications/read')
  markRead(@Req() req) {
    return this.chatService.markNotificationsRead(req.user.userId);
  }
}