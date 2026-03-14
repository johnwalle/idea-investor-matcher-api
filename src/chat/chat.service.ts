// src/modules/chat/chat.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(investorId: string, ideaId: string) {
    const idea = await this.prisma.idea.findUnique({ where: { id: ideaId } });

    if (!idea) throw new NotFoundException('Idea not found');

    const existing = await this.prisma.chatRoom.findUnique({
      where: { ideaId_investorId_room_unique: { ideaId, investorId } },
    });

    if (existing) return existing;

    return this.prisma.chatRoom.create({
      data: {
        ideaId,
        investorId,
        entrepreneurId: idea.founderId, // founderId in Idea = entrepreneurId in ChatRoom
      },
    });
  }

  async saveMessage(dto: SendMessageDto) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: dto.roomId },
    });

    if (!room) throw new NotFoundException('Chat room not found');

    const isParticipant =
      room.investorId === dto.senderId ||
      room.entrepreneurId === dto.senderId;

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this room');
    }

    return this.prisma.message.create({
      data: {
        roomId: dto.roomId,
        senderId: dto.senderId,
        content: dto.content,
      },
      include: {
        sender: { select: { id: true, fullName: true, profilePic: true } },
      },
    });
  }

  async createNotification(roomId: string, senderId: string, content: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        investor: { select: { id: true, fullName: true } },
        entrepreneur: { select: { id: true, fullName: true } },
      },
    });

    if (!room) throw new NotFoundException('Chat room not found');

    const isInvestor = room.investorId === senderId;
    const recipientId = isInvestor ? room.entrepreneurId : room.investorId;
    const senderUser = isInvestor ? room.investor : room.entrepreneur;

    const notification = await this.prisma.notification.create({
      data: {
        userId: recipientId,
        message: `New message from ${senderUser.fullName}: "${content.slice(0, 50)}"`,
      },
    });

    return { ...notification, recipientId };
  }

  async getRoomMessages(roomId: string, userId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundException('Chat room not found');

    const isParticipant =
      room.investorId === userId || room.entrepreneurId === userId;

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this room');
    }

    // mark messages as read for this user
    await this.prisma.message.updateMany({
      where: {
        roomId,
        read: false,
        NOT: { senderId: userId },
      },
      data: { read: true },
    });

    return this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, fullName: true, profilePic: true } },
      },
    });
  }

  async getMyRooms(userId: string) {
    return this.prisma.chatRoom.findMany({
      where: {
        OR: [{ investorId: userId }, { entrepreneurId: userId }],
      },
      include: {
        idea: { select: { id: true, startupName: true, pitchTitle: true } },
        investor: { select: { id: true, fullName: true, profilePic: true } },
        entrepreneur: { select: { id: true, fullName: true, profilePic: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // last message preview
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markNotificationsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}



