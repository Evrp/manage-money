import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { User } from '../../schemas/user.schema';
import { Budget } from '../../schemas/budget.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Budget.name) private budgetModel: Model<Budget>,
  ) {}

  async sendLineMessage(to: string, messages: any[]) {
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!accessToken) return;

    try {
      await axios.post(
        'https://api.line.me/v2/bot/message/push',
        { to, messages },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      console.error('LINE Push Message Error:', (error as any).response?.data || (error as any).message);
    }
  }

  async checkBudgetAlerts(userId: string, categoryId: string, month: number, year: number) {
    const budget = await this.budgetModel.findOne({ userId, categoryId, month, year }).populate('categoryId');
    if (!budget || budget.limitAmount <= 0) return;

    const percent = (budget.spentAmount / budget.limitAmount) * 100;
    const user = await this.userModel.findById(userId);
    if (!user) return;

    if (percent >= 90 && !budget.alertSent90) {
      await this.sendBudgetAlert(user.lineUserId, budget, 90);
      budget.alertSent90 = true;
      await budget.save();
    } else if (percent >= 80 && !budget.alertSent80) {
      await this.sendBudgetAlert(user.lineUserId, budget, 80);
      budget.alertSent80 = true;
      await budget.save();
    }
  }

  private async sendBudgetAlert(lineUserId: string, budget: any, level: number) {
    // Generate Flex Message JSON (Simplified for now)
    const color = level === 90 ? '#FF3B30' : '#FF9500';
    const message = {
      type: 'flex',
      altText: `⚠️ ใกล้ถึงงบประมาณ ${budget.categoryId.name} แล้ว!`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'แจ้งเตือนงบประมาณ',
              weight: 'bold',
              color: '#FFFFFF',
            },
          ],
          backgroundColor: color,
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: budget.categoryId.name,
              weight: 'bold',
              size: 'xl',
            },
            {
              type: 'text',
              text: `ใช้ไปแล้ว ฿${budget.spentAmount.toLocaleString()} จาก ฿${budget.limitAmount.toLocaleString()}`,
              margin: 'md',
            },
          ],
        },
      },
    };

    await this.sendLineMessage(lineUserId, [message]);
  }
}
