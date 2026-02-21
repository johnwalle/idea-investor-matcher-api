import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EntrepreneurService } from './entrepreneur.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { AuthGuard } from '@nestjs/passport';
import { Express } from 'express';

interface JwtUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('entrepreneur')
export class EntrepreneurController {
  constructor(
    private readonly entrepreneurService: EntrepreneurService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('ideas')
  @UseInterceptors(
    FileInterceptor('pitchDeck', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(
            new BadRequestException('Only PDF files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async createIdea(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateIdeaDto,
    @Req() req: { user: JwtUser },
  ) {
    let pitchDeckUrl: string | null = null;
    let pitchDeckId: string | null = null;

    // ✅ Upload only if file exists (optional field)
    if (file) {
      const uploadResult =
        await this.cloudinaryService.uploadPitchDeck(file);

      pitchDeckUrl = uploadResult.url;
      pitchDeckId = uploadResult.publicId;
    }

    return this.entrepreneurService.createIdea(
      req.user.userId,
      dto,
      pitchDeckUrl,
      pitchDeckId,
    );
  }
}