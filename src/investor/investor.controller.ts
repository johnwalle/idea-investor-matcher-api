import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  Query
} from '@nestjs/common';
import { InvestorService } from './investor.service';
import { InvestorOnboardingDto } from './dto/investor-onboarding.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetIdeasQueryDto } from './dto/get-ideas-query.dto';



@Controller('investor')
export class InvestorController {
  constructor(private investorService: InvestorService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('onboarding')
  async onboarding(@Req() req, @Body() dto: InvestorOnboardingDto) {
    return this.investorService.onboarding(req.user.userId, dto);
  }

@UseGuards(AuthGuard('jwt'))
@Get('ideas')
async getIdeas(@Req() req, @Query() query: GetIdeasQueryDto) {
  return this.investorService.getIdeas(req.user.userId,query);
}

@UseGuards(AuthGuard('jwt'))
@Get('idea/:id')
async getSingleIdea(@Param('id') id: string) {
  return this.investorService.getSingleIdea(id);
}

}
