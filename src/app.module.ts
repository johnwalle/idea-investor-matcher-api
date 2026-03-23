import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InvestorModule } from './investor/investor.moudle';
import { EntrepreneurModule } from './entrepreneur/entrepreneur.module';
import { RedisModule } from './redis/redis.module'; 
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, InvestorModule, EntrepreneurModule, RedisModule, NotificationModule],
})
export class AppModule {}
