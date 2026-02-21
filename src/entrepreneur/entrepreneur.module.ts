import { Module } from '@nestjs/common';
import { EntrepreneurController } from './entrepreneur.controller';
import { EntrepreneurService } from './entrepreneur.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Module({
  controllers: [EntrepreneurController],
  providers: [EntrepreneurService, CloudinaryService],
})
export class EntrepreneurModule {}