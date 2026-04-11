import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WebhookService {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleEvent(event: any) {
    const { type, source, message } = event;
    const userId = source.userId;

    if (type === 'follow') {
      await this.sendWelcomeMessage(userId);
    } else if (type === 'message') {
      if (message.type === 'text' && message.text === 'สรุป') {
        await this.sendMonthlySummary(userId);
      } else if (message.type === 'image') {
        await this.notificationsService.sendLineMessage(userId, [
          { type: 'text', text: 'กด 📸 ในเมนูด้านล่างเพื่ออัพโหลดสลิปได้เลย!' }
        ]);
      }
    }
  }

  private async sendWelcomeMessage(lineUserId: string) {
    const message = {
      type: 'text',
      text: 'ยินดีต้อนรับสู่ MoneyFlow! 💰\n\nช่วยคุณจัดการรายรับ-รายจ่ายผ่าน LINE ได้ง่ายๆ\n\n- อัพโหลดสลิปธนาคารเพื่อบันทึกอัตโนมัติ\n- ตั้งงบประมาณรายเดือน\n- ดู Dashboard สรุปผลสวยๆ\n\nเริ่มใช้งานได้ที่เมนูด้านล่างเลยครับ!',
    };
    await this.notificationsService.sendLineMessage(lineUserId, [message]);
  }

  private async sendMonthlySummary(lineUserId: string) {
    // Placeholder for monthly summary call
    const message = {
      type: 'text',
      text: 'ฟีเจอร์สรุปรายเดือนกำลังตามมาเร็วๆ นี้ครับ!',
    };
    await this.notificationsService.sendLineMessage(lineUserId, [message]);
  }
}
