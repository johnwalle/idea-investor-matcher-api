// src/modules/chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // join a chat room — emit { roomId, userId }
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.roomId);
    // also join personal room for notifications
    client.join(data.userId);
    client.emit('joinedRoom', { roomId: data.roomId });
  }

  // send a message — emit { roomId, senderId, content }
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.chatService.saveMessage(dto);

    // broadcast to everyone in the room
    this.server.to(dto.roomId).emit('newMessage', message);

    // create and emit notification to recipient's personal room
    const notification = await this.chatService.createNotification(
      dto.roomId,
      dto.senderId,
      dto.content,
    );

    this.server.to(notification.recipientId).emit('newNotification', {
      id: notification.id,
      message: notification.message,
      read: notification.read,
      createdAt: notification.createdAt,
    });
  }
}