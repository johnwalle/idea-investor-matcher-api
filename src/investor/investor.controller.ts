import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
  Delete,
} from '@nestjs/common';
import { InvestorService } from './investor.service';
import { InvestorOnboardingDto } from './dto/investor-onboarding.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetIdeasQueryDto } from './dto/get-ideas-query.dto';

@Controller('investor')
@UseGuards(AuthGuard('jwt'))
export class InvestorController {
  constructor(private investorService: InvestorService) {}

  @Post('onboarding')
  async onboarding(@Req() req, @Body() dto: InvestorOnboardingDto) {
    return this.investorService.onboarding(req.user.userId, dto);
  }

  @Get('ideas')
  async getIdeas(@Req() req, @Query() query: GetIdeasQueryDto) {
    return this.investorService.getIdeas(req.user.userId, query);
  }

  // 👇 Register view automatically when fetching single idea
  @Get('idea/:id')
  async getSingleIdea(@Req() req, @Param('id') id: string) {
    return this.investorService.getSingleIdea(req.user.userId, id);
  }

  // 👇 Mark as interested
  @Post('idea/:id/interested')
  async markInterested(@Req() req, @Param('id') id: string) {
    return this.investorService.markInterested(req.user.userId, id);
  }

  // 👇 Remove interest
  @Delete('idea/:id/interested')
  async removeInterest(@Req() req, @Param('id') id: string) {
    return this.investorService.removeInterest(req.user.userId, id);
  }
}