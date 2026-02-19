import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { InvestorOnboardingDto } from './dto/investor-onboarding.dto';
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
}
