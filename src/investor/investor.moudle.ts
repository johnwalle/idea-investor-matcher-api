import { Module } from '@nestjs/common';
import { InvestorService } from './investor.service';
import { InvestorController } from './investor.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [InvestorService],
  controllers: [InvestorController],
})
export class InvestorModule {}
