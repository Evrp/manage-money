import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { AdvisorModule } from "../advisor/advisor.module";
import { CategoriesModule } from "../categories/categories.module";
import { SlipsModule } from "../slips/slips.module";
import { ChatFlowService } from "./chat-flow.service";

@Module({
  imports: [
    NotificationsModule,
    TransactionsModule,
    AdvisorModule,
    CategoriesModule,
    SlipsModule,
  ],
  providers: [ChatFlowService],
  exports: [ChatFlowService],
})
export class ChatFlowModule {}
