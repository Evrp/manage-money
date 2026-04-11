import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(
    @Request() req,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.dashboardService.getSummary(req.user.userId, Number(month), Number(year));
  }

  @Get('chart/monthly')
  getMonthlyChart(@Request() req, @Query('year') year: number) {
    return this.dashboardService.getMonthlyChart(req.user.userId, Number(year));
  }

  @Get('chart/category')
  getCategoryBreakdown(
    @Request() req,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.dashboardService.getCategoryBreakdown(
      req.user.userId,
      Number(month),
      Number(year),
    );
  }
}
