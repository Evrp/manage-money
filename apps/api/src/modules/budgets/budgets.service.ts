import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Budget } from '../../schemas/budget.schema';
import { Category } from '../../schemas/category.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel(Budget.name) private budgetModel: Model<Budget>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findByMonth(userId: string, month: number, year: number) {
    // ... logic remains same
  }

  // ... other methods

  async updateSpentAmount(userId: string, categoryId: string, month: number, year: number, amountDelta: number) {
    const budget = await this.budgetModel.findOneAndUpdate(
      { userId, categoryId, month, year },
      { $inc: { spentAmount: amountDelta } },
      { new: true, upsert: true },
    );

    // Trigger alert check
    await this.notificationsService.checkBudgetAlerts(userId, categoryId, month, year);
    
    return budget;
  }
}
