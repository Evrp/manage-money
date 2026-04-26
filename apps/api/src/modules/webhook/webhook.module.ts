import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { WebhookService } from "./webhook.service";
import { WebhookController } from "./webhook.controller";
import { NotificationsModule } from "../notifications/notifications.module";
import { AdvisorModule } from "../advisor/advisor.module";
import { AuthModule } from "../auth/auth.module";
import { User, UserSchema } from "../../schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    NotificationsModule,
    AdvisorModule,
    AuthModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
