import { Module } from "@nestjs/common";
import { AdvisorService } from "./advisor.service";
import { TransactionsModule } from "../transactions/transactions.module";
import { BudgetsModule } from "../budgets/budgets.module";

@Module({
  imports: [TransactionsModule, BudgetsModule],
  providers: [AdvisorService],
  exports: [AdvisorService],
})
export class AdvisorModule {}
