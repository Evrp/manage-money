import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { AdvisorModule } from "../advisor/advisor.module";
import { ChatFlowService } from "./chat-flow.service";

@Module({
  imports: [NotificationsModule, TransactionsModule, AdvisorModule],
  providers: [ChatFlowService],
  exports: [ChatFlowService],
})
export class ChatFlowModule {}
