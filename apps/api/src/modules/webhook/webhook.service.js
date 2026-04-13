"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("../notifications/notifications.service");
let WebhookService = class WebhookService {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    async handleEvent(event) {
        const { type, source, message } = event;
        const userId = source.userId;
        if (type === "follow") {
            await this.sendWelcomeMessage(userId);
        }
        else if (type === "message") {
            if (message.type === "text" && message.text === "สรุป") {
                await this.sendMonthlySummary(userId);
            }
            else if (message.type === "image") {
                await this.notificationsService.sendLineMessage(userId, [
                    { type: "text", text: "กด 📸 ในเมนูด้านล่างเพื่ออัพโหลดสลิปได้เลย!" },
                ]);
            }
        }
    }
    async sendWelcomeMessage(lineUserId) {
        const message = {
            type: "text",
            text: "ยินดีต้อนรับสู่ MoneyFlow! 💰\n\nช่วยคุณจัดการรายรับ-รายจ่ายผ่าน LINE ได้ง่ายๆ\n\n- อัพโหลดสลิปธนาคารเพื่อบันทึกอัตโนมัติ\n- ตั้งงบประมาณรายเดือน\n- ดู Dashboard สรุปผลสวยๆ\n\nเริ่มใช้งานได้ที่เมนูด้านล่างเลยครับ!",
        };
        await this.notificationsService.sendLineMessage(lineUserId, [message]);
    }
    async sendMonthlySummary(lineUserId) {
        // Placeholder for monthly summary call
        const message = {
            type: "text",
            text: "ฟีเจอร์สรุปรายเดือนกำลังตามมาเร็วๆ นี้ครับ!",
        };
        await this.notificationsService.sendLineMessage(lineUserId, [message]);
    }
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map