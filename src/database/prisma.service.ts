// src/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Called when NestJS module is initialized
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma connected to database');
  }

  // Called when NestJS module is destroyed (app shutdown)
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Prisma disconnected from database');
  }
}
