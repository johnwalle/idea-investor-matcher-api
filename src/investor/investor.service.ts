import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { InvestorOnboardingDto } from './dto/investor-onboarding.dto';
import { GetIdeasQueryDto } from './dto/get-ideas-query.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class InvestorService {
  constructor(private prisma: PrismaService) {}

  async onboarding(userId: string, dto: InvestorOnboardingDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new ForbiddenException('User not found');

    if (user.role !== Role.INVESTOR) {
      throw new ForbiddenException(
        'Only investors can complete onboarding',
      );
    }

    if (dto.minFunding >= dto.maxFunding) {
      throw new BadRequestException(
        'Minimum funding must be less than maximum funding',
      );
    }

    const existingProfile =
      await this.prisma.investorProfile.findUnique({
        where: { userId },
      });

    let profile;

    if (existingProfile) {
      profile = await this.prisma.investorProfile.update({
        where: { userId },
        data: {
          preferredStages: dto.preferredStages,
          industries: dto.industries,
          minFunding: dto.minFunding,
          maxFunding: dto.maxFunding,
          investmentThesis: dto.investmentThesis,
        },
      });
    } else {
      profile = await this.prisma.investorProfile.create({
        data: {
          userId,
          preferredStages: dto.preferredStages,
          industries: dto.industries,
          minFunding: dto.minFunding,
          maxFunding: dto.maxFunding,
          investmentThesis: dto.investmentThesis,
        },
      });

      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnboarded: true },
      });
    }

    return {
      message: 'Investor onboarding completed successfully',
      profile,
    };
  }


  async getIdeas(userId: string, query: GetIdeasQueryDto) {
  const {
    industry,
    stage,
    minFunding,
    maxFunding,
    search,
    region,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    order = 'desc',
  } = query;

     const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new ForbiddenException('User not found');

    if (user.role !== Role.INVESTOR) {
      throw new ForbiddenException(
        'Only investors can view startup ideas',
      );
    }
  const skip = (page - 1) * limit;

  const where: any = {};

  // ---------- Filters ----------
  if (industry) where.industry = industry;
  if (stage) where.stage = stage;
  if (region) where.region = region;

  if (minFunding || maxFunding) {
    where.fundingAmount = {};
    if (minFunding) where.fundingAmount.gte = minFunding;
    if (maxFunding) where.fundingAmount.lte = maxFunding;
  }

  if (search) {
    where.OR = [
      { startupName: { contains: search, mode: 'insensitive' } },
      { pitchTitle: { contains: search, mode: 'insensitive' } },
    ];
  }

  // ---------- Query ----------
  const [ideas, total] = await Promise.all([
    this.prisma.idea.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: order,
      },
      select: {
        id: true,
        startupName: true,
        pitchTitle: true,
        industry: true,
        stage: true,
        fundingAmount: true,
        equityOffered: true,
        region: true,
        pitchDeckUrl: true,
        createdAt: true,
      },
    }),
    this.prisma.idea.count({ where }),
  ]);

  return {
    data: ideas,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async getSingleIdea(id: string) {
  const idea = await this.prisma.idea.findUnique({
    where: { id },
    include: {
      founder: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!idea) {
    throw new NotFoundException('Idea not found');
  }

  return idea;
}

}

