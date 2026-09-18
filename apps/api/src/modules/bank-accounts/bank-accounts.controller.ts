import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { BankAccountsService } from "./bank-accounts.service";
import { CreateBankAccountDto } from "./dto/create-bank-account.dto";

@Controller("bank-accounts")
@UseGuards(JwtAuthGuard)
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.bankAccountsService.findAll(req.user.userId);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateBankAccountDto) {
    return this.bankAccountsService.create(req.user.userId, dto);
  }
}
