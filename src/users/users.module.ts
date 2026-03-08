// src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../database/prisma.module';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Module({
  imports: [PrismaModule],
  providers: [UsersService, CloudinaryService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
