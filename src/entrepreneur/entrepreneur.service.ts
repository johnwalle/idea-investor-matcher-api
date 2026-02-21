import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class EntrepreneurService {
  constructor(private readonly prisma: PrismaService) {}

  async createIdea(
    founderId: string,
    dto: CreateIdeaDto,
    pitchDeckUrl?: string | null,
    pitchDeckId?: string | null,
  ) {
    // 🔎 Ensure user exists
    const user = await this.prisma.user.findUnique({
      where: { id: founderId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 🔐 Ensure only entrepreneurs can create ideas
    if (user.role !== Role.ENTREPRENEUR) {
      throw new ForbiddenException(
        'Only entrepreneurs can create ideas',
      );
    }

    const idea = await this.prisma.idea.create({
      data: {
        startupName: dto.startupName,
        pitchTitle: dto.pitchTitle,
        description: dto.description,
        industry: dto.industry,
        stage: dto.stage,
        fundingAmount: dto.fundingAmount,
        roundType: dto.roundType ?? null,
        equityOffered: dto.equityOffered,
        region: dto.region,
        pitchDeckUrl: pitchDeckUrl ?? null,
        pitchDeckId: pitchDeckId ?? null,
        founderId,
      },
    });

    return {
      message: 'Idea created successfully',
      idea,
    };
  }
}