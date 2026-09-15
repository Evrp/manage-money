import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
  Request,
} from "@nestjs/common";
import { timingSafeEqual } from "crypto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateRecurringExpenseDto } from "./dto/create-recurring-expense.dto";
import { UpdateRecurringExpenseDto } from "./dto/update-recurring-expense.dto";
import { RemindersService } from "./reminders.service";

@Controller("recurring-expenses")
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req) {
    return this.remindersService.findAll(req.user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() dto: CreateRecurringExpenseDto) {
    return this.remindersService.create(req.user.userId, dto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdateRecurringExpenseDto,
  ) {
    return this.remindersService.update(req.user.userId, id, dto);
  }

  @Get("cron/run")
  @HttpCode(HttpStatus.OK)
  async runCron(
    @Headers("authorization") authorization?: string,
    @Headers("x-cron-secret") customSecret?: string,
  ) {
    const configuredSecret = process.env.CRON_SECRET;
    const suppliedSecret =
      customSecret || authorization?.replace(/^Bearer\s+/i, "");
    if (
      !configuredSecret ||
      !suppliedSecret ||
      configuredSecret.length !== suppliedSecret.length ||
      !timingSafeEqual(
        Buffer.from(configuredSecret),
        Buffer.from(suppliedSecret),
      )
    ) {
      throw new UnauthorizedException();
    }
    return this.remindersService.runDueReminders();
  }
}
