import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Patch,
} from "@nestjs/common";
import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { QueryTransactionDto } from "./dto/query-transaction.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("transactions")
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(@Request() req, @Query() query: QueryTransactionDto) {
    return this.transactionsService.findAll(req.user.userId, query);
  }

  @Get("summary")
  getSummary(
    @Request() req,
    @Query("month") month: number,
    @Query("year") year: number,
  ) {
    return this.transactionsService.getSummary(
      req.user.userId,
      Number(month),
      Number(year),
    );
  }

  @Post()
  create(@Request() req, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(
      req.user.userId,
      createTransactionDto,
    );
  }

  @Delete(":id")
  remove(@Request() req, @Param("id") id: string) {
    return this.transactionsService.remove(req.user.userId, id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Request() req, @Body() updateData: any) {
    return this.transactionsService.update(req.user.userId, id, updateData);
  }
}
