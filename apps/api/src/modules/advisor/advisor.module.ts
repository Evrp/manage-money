import { Module } from "@nestjs/common";
import { AdvisorService } from "./advisor.service";
import { TransactionsModule } from "../transactions/transactions.module";
import { BudgetsModule } from "../budgets/budgets.module";
import { AiProviderModule } from "../ai-provider/ai-provider.module";

@Module({
  imports: [TransactionsModule, BudgetsModule, AiProviderModule],
  providers: [AdvisorService],
  exports: [AdvisorService],
})
export class AdvisorModule {}
