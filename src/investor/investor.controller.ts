import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  Patch,
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

  @Get('preferences')
  async getPreferences(@Req() req) {
    return this.investorService.getPreferences(req.user.userId);
  }

  @Patch('preferences')
  async updatePreferences(@Req() req, @Body() dto: InvestorOnboardingDto) {
    return this.investorService.updatePreferences(req.user.userId, dto);
  }

  @Get('ideas')
  async getIdeas(@Req() req, @Query() query: GetIdeasQueryDto) {
    return this.investorService.getIdeas(req.user.userId, query);
  }

  @Get('idea/:id')
  async getSingleIdea(@Req() req, @Param('id') id: string) {
    return this.investorService.getSingleIdea(req.user.userId, id);
  }

  @Post('idea/:id/interested')
  async markInterested(@Req() req, @Param('id') id: string) {
    return this.investorService.markInterested(req.user.userId, id);
  }

  @Delete('idea/:id/interested')
  async removeInterest(@Req() req, @Param('id') id: string) {
    return this.investorService.removeInterest(req.user.userId, id);
  }
}