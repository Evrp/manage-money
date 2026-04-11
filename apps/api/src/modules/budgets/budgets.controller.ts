import { Controller, Get, Put, Body, Query, UseGuards, Request } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  findByMonth(
    @Request() req,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.budgetsService.findByMonth(req.user.userId, Number(month), Number(year));
  }

  @Put('limit')
  updateLimit(
    @Request() req,
    @Body('categoryId') categoryId: string,
    @Body('month') month: number,
    @Body('year') year: number,
    @Body('limitAmount') limitAmount: number,
  ) {
    return this.budgetsService.updateLimit(
      req.user.userId,
      categoryId,
      Number(month),
      Number(year),
      limitAmount,
    );
  }
}
