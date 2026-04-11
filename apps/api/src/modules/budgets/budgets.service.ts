import { Injectable } from '@nestjs/common';
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
    const categories = await this.categoryModel.find({ userId, isActive: true, type: 'expense' });
    
    const budgets = await Promise.all(
      categories.map(async (cat) => {
        let budget = await this.budgetModel.findOne({
          userId,
          categoryId: cat._id,
          month,
          year,
        });

        if (!budget) {
          budget = await this.budgetModel.create({
            userId,
            categoryId: cat._id,
            month,
            year,
            limitAmount: cat.monthlyLimit || 0,
            spentAmount: 0,
          });
        }
        return budget.populate('categoryId');
      }),
    );

    return budgets;
  }

  async updateLimit(userId: string, categoryId: string, month: number, year: number, limitAmount: number) {
    const budget = await this.budgetModel.findOneAndUpdate(
      { userId, categoryId, month, year },
      { $set: { limitAmount } },
      { new: true, upsert: true },
    );
    return budget;
  }

  async updateSpentAmount(userId: string, categoryId: string, month: number, year: number, amountDelta: number) {
    const budget = await this.budgetModel.findOneAndUpdate(
      { userId, categoryId, month, year },
      { $inc: { spentAmount: amountDelta } },
      { new: true, upsert: true },
    );

    await this.notificationsService.checkBudgetAlerts(userId, categoryId, month, year);
    
    return budget;
  }
}
