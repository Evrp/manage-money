import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { NotificationsService } from "../notifications/notifications.service";
import { AdvisorService } from "../advisor/advisor.service";
import { User } from "../../schemas/user.schema";

@Injectable()
export class WebhookService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly notificationsService: NotificationsService,
    private readonly advisorService: AdvisorService,
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
          await this.handleAdvisorChat(lineUserId, message.text);
        }
      } else if (message.type === "image") {
        await this.notificationsService.sendLineMessage(lineUserId, [
          { type: "text", text: "กด 📸 ในเมนูด้านล่างเพื่ออัพโหลดสลิปได้เลย!" },
        ]);
      }
    }
  }

  private async handleAdvisorChat(lineUserId: string, text: string) {
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

    const advice = await this.advisorService.getAdvice(
      user._id.toString(),
      text,
    );
    await this.notificationsService.sendLineMessage(lineUserId, [
      { type: "text", text: advice },
    ]);
  }

  private async sendWelcomeMessage(lineUserId: string) {
    const message = {
      type: "text",
      text: "ยินดีต้อนรับสู่ MoneyFlow! 💰\n\nช่วยคุณจัดการรายรับ-รายจ่ายผ่าน LINE ได้ง่ายๆ\n\n- อัพโหลดสลิปธนาคารเพื่อบันทึกอัตโนมัติ\n- ตั้งงบประมาณรายเดือน\n- ดู Dashboard สรุปผลสวยๆ\n\nเริ่มใช้งานได้ที่เมนูด้านล่างเลยครับ!",
    };
    await this.notificationsService.sendLineMessage(lineUserId, [message]);
  }

  private async sendMonthlySummary(lineUserId: string) {
    // Placeholder for monthly summary call
    const message = {
      type: "text",
      text: "ฟีเจอร์สรุปรายเดือนกำลังตามมาเร็วๆ นี้ครับ!",
    };
    await this.notificationsService.sendLineMessage(lineUserId, [message]);
  }
}
