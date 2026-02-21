import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InvestorModule } from './investor/investor.moudle';
import { EntrepreneurModule } from './entrepreneur/entrepreneur.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, InvestorModule, EntrepreneurModule],
})
export class AppModule {}
