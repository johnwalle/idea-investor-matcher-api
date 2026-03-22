import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../database/prisma.service'; // Your Prisma wrapper
import { RegisterPushTokenDto } from './dto/register-pushToken.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificationsService {
  private expo: Expo;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService, private configService: ConfigService) {
    const expoToken = this.configService.get<string>('EXPO_ACCESS_TOKEN');
    
    this.expo = new Expo({ accessToken: expoToken });
  }

  async notifyUser(sendDto: SendNotificationDto) {
    // 1. Get all tokens for the user from Postgres
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId: sendDto.userId },
    });

    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens
      .filter(t => Expo.isExpoPushToken(t.tokenValue))
      .map(t => ({
        to: t.tokenValue,
        sound: 'default',
        title: sendDto.title,
        body: sendDto.body,
        data: sendDto.data,
      }));

    // 2. Send in chunks (Expo limit is 100)
    const chunks = this.expo.chunkPushNotifications(messages);
    
    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        
        // 3. Cleanup logic (Immediate errors)
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
            const staleToken = (chunk[i].to as string);
            await this.removeStaleToken(staleToken);
          }
        }
      } catch (error) {
        this.logger.error('Failed to send notification chunk', error);
      }
    }
  }

  private async removeStaleToken(tokenValue: string) {
    this.logger.warn(`Deleting stale token: ${tokenValue}`);
    await this.prisma.pushToken.deleteMany({ where: { tokenValue } });
  }

  async upsertToken(dto: RegisterPushTokenDto) {
    try {
      return await this.prisma.pushToken.upsert({
        where: { tokenValue: dto.token },
        update: { userId: dto.userId },
        create: {
          tokenValue: dto.token,
          userId: dto.userId,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to upsert push token for user ${dto.userId}: ${error.message}`);
      throw new InternalServerErrorException('Could not save push token');
    }
  }

  async removeToken(token: string) {
    // We use deleteMany so it doesn't crash if the token was already gone
    return await this.prisma.pushToken.deleteMany({
      where: { tokenValue: token },
    });
  }
}