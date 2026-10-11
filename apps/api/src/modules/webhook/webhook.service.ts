import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { NotificationsService } from "../notifications/notifications.service";
import { User } from "../../schemas/user.schema";
import { ChatFlowService } from "../chat-flow/chat-flow.service";

@Injectable()
export class WebhookService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly notificationsService: NotificationsService,
    private readonly chatFlowService: ChatFlowService,
  ) {}

  async handleEvent(event: any) {
    const { type, source, message } = event;
    const lineUserId = source.userId;

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
