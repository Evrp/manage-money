import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreditCardsService } from "./credit-cards.service";
import { CreateCreditCardDto } from "./dto/create-credit-card.dto";
import { UpdateCreditCardDto } from "./dto/update-credit-card.dto";
import { CreateCreditCardPaymentDto } from "./dto/create-credit-card-payment.dto";
import { StatementQueryDto } from "./dto/statement-query.dto";
import { UpdateStatementDto } from "./dto/update-statement.dto";

@Controller("credit-cards")
@UseGuards(JwtAuthGuard)
export class CreditCardsController {
  constructor(private readonly creditCardsService: CreditCardsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.creditCardsService.findAll(req.user.userId);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateCreditCardDto) {
    return this.creditCardsService.create(req.user.userId, dto);
  }

  @Patch(":id")
  update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateCreditCardDto,
  ) {
    return this.creditCardsService.update(req.user.userId, id, dto);
  }

  @Get(":id/statements")
  getStatement(
    @Request() req: any,
    @Param("id") id: string,
    @Query() query: StatementQueryDto,
  ) {
    return this.creditCardsService.getStatement(
      req.user.userId,
      id,
      query.month,
      query.year,
    );
  }

  @Post(":id/payments")
  recordPayment(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: CreateCreditCardPaymentDto,
  ) {
    return this.creditCardsService.recordPayment(req.user.userId, id, dto);
  }

  @Put(":id/statements/:year/:month")
  updateStatementDueDate(
    @Request() req: any,
    @Param("id") id: string,
    @Param("year") year: string,
    @Param("month") month: string,
    @Body() dto: UpdateStatementDto,
  ) {
    return this.creditCardsService.updateStatementDueDate(
      req.user.userId,
      id,
      Number(month),
      Number(year),
      dto.dueDate,
    );
  }
}
