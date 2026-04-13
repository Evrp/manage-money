import { Module } from "@nestjs/common";
import { WebhookService } from "./webhook.service";
import { WebhookController } from "./webhook.controller";
import { NotificationsModule } from "../notifications/notifications.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [NotificationsModule, AuthModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
