import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { WebhookService } from "./webhook.service";
import { WebhookController } from "./webhook.controller";
import { NotificationsModule } from "../notifications/notifications.module";
import { AdvisorModule } from "../advisor/advisor.module";
import { AuthModule } from "../auth/auth.module";
import { User, UserSchema } from "../../schemas/user.schema";
import { ChatFlowModule } from "../chat-flow/chat-flow.module";
import {
  WebhookEvent,
  WebhookEventSchema,
} from "../../schemas/webhook-event.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: WebhookEvent.name, schema: WebhookEventSchema },
    ]),
    NotificationsModule,
    AdvisorModule,
    AuthModule,
    ChatFlowModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
