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

  // --------------------------------------------------
  // INVESTOR ONBOARDING
  // --------------------------------------------------
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

  // --------------------------------------------------
  // GET IDEAS (WITH FILTERS)
  // --------------------------------------------------
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
          viewsCount: true,
          interestedCount: true,
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

  // --------------------------------------------------
  // GET SINGLE IDEA (REGISTER VIEW + isInterested)
  // --------------------------------------------------
  async getSingleIdea(userId: string, ideaId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new ForbiddenException('User not found');

    const idea = await this.prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        founder: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!idea) throw new NotFoundException('Idea not found');

    // Prevent founder self-view
    if (idea.founderId !== userId) {
      await this.registerView(ideaId, userId);
    }

    // Check if investor is interested
    const interest = await this.prisma.ideaInterest.findUnique({
      where: {
        ideaId_investorId_interest_unique: {
          ideaId,
          investorId: userId,
        },
      },
    });

    const founder = await this.prisma.user.findUnique({
      where: { id: idea.founderId },
    });

    if (!founder) throw new ForbiddenException('Founder not found');

    return {
      ...idea,
      isInterested: !!interest,
      email: founder.email,
    };
  }

  // --------------------------------------------------
  // REGISTER UNIQUE VIEW
  // --------------------------------------------------
  private async registerView(ideaId: string, investorId: string) {
    try {
      await this.prisma.ideaView.create({
        data: {
          ideaId,
          investorId,
        },
      });

      await this.prisma.idea.update({
        where: { id: ideaId },
        data: {
          viewsCount: { increment: 1 },
        },
      });
    } catch (error) {
      // P2002 = unique constraint violation (already viewed)
      if (error.code !== 'P2002') {
        throw error;
      }
    }
  }

  // --------------------------------------------------
  // MARK AS INTERESTED
  // --------------------------------------------------
  async markInterested(userId: string, ideaId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new ForbiddenException('User not found');
    if (user.role !== Role.INVESTOR) {
      throw new ForbiddenException('Only investors allowed');
    }

    try {
      await this.prisma.ideaInterest.create({
        data: {
          ideaId,
          investorId: userId,
        },
      });

      await this.prisma.idea.update({
        where: { id: ideaId },
        data: {
          interestedCount: { increment: 1 },
        },
      });

      const startup = await this.prisma.idea.findUnique({
        where: { id: ideaId },
      });

      if (!startup) throw new ForbiddenException('Startup not found');

      const founder = await this.prisma.user.findUnique({
        where: { id: startup.founderId },
      });

      if (!founder) throw new ForbiddenException('Founder not found');

      return { message: 'Marked as interested', email: founder.email };
    } catch (error) {
      if (error.code !== 'P2002') {
        throw error;
      }

      return { message: 'Already marked as interested' };
    }
  }

  // --------------------------------------------------
  // REMOVE INTEREST
  // --------------------------------------------------
  async removeInterest(userId: string, ideaId: string) {
    const deleted = await this.prisma.ideaInterest.deleteMany({
      where: {
        ideaId,
        investorId: userId,
      },
    });

    if (deleted.count > 0) {
      await this.prisma.idea.update({
        where: { id: ideaId },
        data: {
          interestedCount: { decrement: 1 },
        },
      });
    }

    return { message: 'Interest removed' };
  }
}