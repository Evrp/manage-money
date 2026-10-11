import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { randomUUID } from "crypto";
import { NotificationsService } from "../notifications/notifications.service";
import { User } from "../../schemas/user.schema";
import { ChatFlowService } from "../chat-flow/chat-flow.service";
import {
  WebhookEvent,
  WebhookEventStatus,
} from "../../schemas/webhook-event.schema";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(WebhookEvent.name)
    private webhookEventModel: Model<WebhookEvent>,
    private readonly notificationsService: NotificationsService,
    private readonly chatFlowService: ChatFlowService,
  ) {}

  async handleEvent(event: any) {
    const eventId = event?.webhookEventId;
    if (!eventId) return this.processEvent(event);

    const claimToken = await this.claimWebhookEvent(eventId);
    if (!claimToken) {
      this.logger.debug(`Skipping already claimed LINE event ${eventId}`);
      return;
    }

    try {
      await this.processEvent(event);
      await this.webhookEventModel.updateOne(
        { eventId, claimToken },
        {
          $set: { status: WebhookEventStatus.COMPLETED },
          $unset: { leaseExpiresAt: 1 },
        },
      );
    } catch (error) {
      await this.webhookEventModel.updateOne(
        { eventId, claimToken },
        { $set: { status: WebhookEventStatus.FAILED } },
      );
      throw error;
    }
  }

  private async claimWebhookEvent(eventId: string): Promise<string | null> {
    const claimToken = randomUUID();
    const now = new Date();
    const leaseExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);
    const expireAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    try {
      await this.webhookEventModel.create({
        eventId,
        status: WebhookEventStatus.PROCESSING,
        claimToken,
        leaseExpiresAt,
        expireAt,
      });
      return claimToken;
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
    }

    const reclaimed = await this.webhookEventModel.findOneAndUpdate(
      {
        eventId,
        $or: [
          { status: WebhookEventStatus.FAILED },
          {
            status: WebhookEventStatus.PROCESSING,
            leaseExpiresAt: { $lte: now },
          },
        ],
      },
      {
        $set: {
          status: WebhookEventStatus.PROCESSING,
          claimToken,
          leaseExpiresAt,
          expireAt,
        },
      },
      { new: true },
    );

    return reclaimed ? claimToken : null;
  }

  private async processEvent(event: any) {
    const { type, source, message } = event;
    const lineUserId = source?.userId;

    if (type === "follow") {
      await this.sendWelcomeMessage(lineUserId);
    } else if (type === "message") {
      if (message.type === "text") {
        if (message.text === "สรุป") {
          await this.sendMonthlySummary(lineUserId);
        } else {
          await this.handleChatMessage(lineUserId, message.text);
        }
      } else if (message.type === "image") {
        const user = await this.userModel.findOne({ lineUserId });
        if (!user) {
          await this.notificationsService.sendLineMessage(lineUserId, [
            {
              type: "text",
              text: "ขออภัยครับ ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบผ่าน LIFF ก่อนนะครับ",
            },
          ]);
          return;
        }
        await this.chatFlowService.handleImage(
          user._id.toString(),
          lineUserId,
          message.id,
        );
      }
    } else if (type === "postback") {
      const user = await this.userModel.findOne({ lineUserId });
      if (!user) return;
      await this.chatFlowService.handlePostback(
        user._id.toString(),
        lineUserId,
        event.postback?.data || "",
      );
    }
  }

  private async handleChatMessage(lineUserId: string, text: string) {
    const user = await this.userModel.findOne({ lineUserId });
    if (!user) {
      await this.notificationsService.sendLineMessage(lineUserId, [
        {
          type: "text",
          text: "ขออภัยครับ ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบผ่าน LIFF ก่อนนะครับ",
        },
      ]);
      return;
    }

    // Inform user that AI is thinking
    // (Optional: LINE typing indicators aren't as easy as a quick message)

    await this.chatFlowService.handleMessage(
      user._id.toString(),
      lineUserId,
      text,
    );
  }

  private async sendWelcomeMessage(lineUserId: string) {
    await this.notificationsService.sendLineMessage(lineUserId, [
      {
        type: "text",
        text: "ยินดีต้อนรับสู่ Fumi Manager! 🐾 เลือกหัวข้อที่อยากดูได้เลยครับ",
      },
      this.chatFlowService.createSummaryTypeBubble(),
    ]);
  }

  private async sendMonthlySummary(lineUserId: string) {
    await this.notificationsService.sendLineMessage(lineUserId, [
      this.chatFlowService.createSummaryTypeBubble(),
    ]);
  }
}
