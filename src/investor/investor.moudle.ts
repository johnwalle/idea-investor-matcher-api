import { Module } from '@nestjs/common';
import { InvestorService } from './investor.service';
import { InvestorController } from './investor.controller';
import { PrismaModule } from '../database/prisma.module';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [PrismaModule, ChatModule],
  providers: [InvestorService],
  controllers: [InvestorController],
})
export class InvestorModule { }
