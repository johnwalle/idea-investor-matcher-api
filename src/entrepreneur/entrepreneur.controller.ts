import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
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
import { UpdateIdeaDto } from './dto/update-idea.dto';
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

  // =========================
  // CREATE IDEA
  // =========================
  @UseGuards(AuthGuard('jwt'))
  @Post('ideas')
  @UseInterceptors(
    FileInterceptor('pitchDeck', {
      limits: { fileSize: 10 * 1024 * 1024 },
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

  // =========================
  // GET MY IDEAS
  // =========================
  @UseGuards(AuthGuard('jwt'))
  @Get('ideas')
  async getMyIdeas(@Req() req: { user: JwtUser }) {
    return this.entrepreneurService.getIdeasByUser(req.user.userId);
  }

  // =========================
  // UPDATE IDEA
  // =========================
  @UseGuards(AuthGuard('jwt'))
  @Patch('ideas/:id')
  @UseInterceptors(
    FileInterceptor('pitchDeck', {
      limits: { fileSize: 10 * 1024 * 1024 },
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
  async updateIdea(
    @Param('id') ideaId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UpdateIdeaDto,
    @Req() req: { user: JwtUser },
  ) {
    let pitchDeckUrl: string | null = null;
    let pitchDeckId: string | null = null;

    if (file) {
      const uploadResult =
        await this.cloudinaryService.uploadPitchDeck(file);

      pitchDeckUrl = uploadResult.url;
      pitchDeckId = uploadResult.publicId;
    }

    return this.entrepreneurService.updateIdea(
      ideaId,
      req.user.userId,
      dto,
      pitchDeckUrl,
      pitchDeckId,
    );
  }

  // =========================
  // DELETE IDEA
  // =========================
  @UseGuards(AuthGuard('jwt'))
  @Delete('ideas/:id')
  async deleteIdea(
    @Param('id') ideaId: string,
    @Req() req: { user: JwtUser },
  ) {
    return this.entrepreneurService.deleteIdea(
      ideaId,
      req.user.userId,
    );
  }
}