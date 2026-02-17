import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../database/prisma.module';
import { MailModule } from '../mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    PassportModule, // 🔥 Required for strategies
    JwtModule.register({}), // we’re using process.env inside strategies
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy, // 🔥 THIS WAS MISSING
  ],
  controllers: [AuthController],
})
export class AuthModule {}
