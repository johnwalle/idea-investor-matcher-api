import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { NotificationsService } from './notification.service';
import { RegisterPushTokenDto } from './dto/register-pushToken.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@Controller('notification')
export class NotificationController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('register-token')
    async register(@Body() dto: RegisterPushTokenDto) {
        return this.notificationsService.upsertToken(dto)
        }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendToUser(@Body() sendDto: SendNotificationDto) {
          
      await this.notificationsService.notifyUser(sendDto);
          
      return {
       message: `Notification process initiated for user ${sendDto.userId}`,
      };
  }

  @Delete('remove-token')
  async removeToken(@Body() data: { token: string }) {
    await this.notificationsService.removeToken(data.token);

    return {
      message: `Push Token deleted successfully`,
    };
  }
}