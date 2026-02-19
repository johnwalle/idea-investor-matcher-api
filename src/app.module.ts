import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InvestorModule } from './investor/investor.moudle';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, InvestorModule],
})
export class AppModule {}
