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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const axios_1 = __importDefault(require("axios"));
const user_schema_1 = require("../../schemas/user.schema");
const budget_schema_1 = require("../../schemas/budget.schema");
let NotificationsService = class NotificationsService {
    constructor(userModel, budgetModel) {
        this.userModel = userModel;
        this.budgetModel = budgetModel;
    }
    async sendLineMessage(to, messages) {
        const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!accessToken)
            return;
        try {
            await axios_1.default.post("https://api.line.me/v2/bot/message/push", { to, messages }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
        }
        catch (error) {
            console.error("LINE Push Message Error:", error.response?.data || error.message);
        }
    }
    async checkBudgetAlerts(userId, categoryId, month, year) {
        const budget = await this.budgetModel
            .findOne({ userId, categoryId, month, year })
            .populate("categoryId");
        if (!budget || budget.limitAmount <= 0)
            return;
        const percent = (budget.spentAmount / budget.limitAmount) * 100;
        const user = await this.userModel.findById(userId);
        if (!user)
            return;
        if (percent >= 90 && !budget.alertSent90) {
            await this.sendBudgetAlert(user.lineUserId, budget, 90);
            budget.alertSent90 = true;
            await budget.save();
        }
        else if (percent >= 80 && !budget.alertSent80) {
            await this.sendBudgetAlert(user.lineUserId, budget, 80);
            budget.alertSent80 = true;
            await budget.save();
        }
    }
    async sendBudgetAlert(lineUserId, budget, level) {
        // Generate Flex Message JSON (Simplified for now)
        const color = level === 90 ? "#FF3B30" : "#FF9500";
        const message = {
            type: "flex",
            altText: `⚠️ ใกล้ถึงงบประมาณ ${budget.categoryId.name} แล้ว!`,
            contents: {
                type: "bubble",
                header: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "text",
                            text: "แจ้งเตือนงบประมาณ",
                            weight: "bold",
                            color: "#FFFFFF",
                        },
                    ],
                    backgroundColor: color,
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "text",
                            text: budget.categoryId.name,
                            weight: "bold",
                            size: "xl",
                        },
                        {
                            type: "text",
                            text: `ใช้ไปแล้ว ฿${budget.spentAmount.toLocaleString()} จาก ฿${budget.limitAmount.toLocaleString()}`,
                            margin: "md",
                        },
                    ],
                },
            },
        };
        await this.sendLineMessage(lineUserId, [message]);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(budget_schema_1.Budget.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map