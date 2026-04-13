import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Budget } from "../../schemas/budget.schema";
import { Category } from "../../schemas/category.schema";
import { Transaction } from "../../schemas/transaction.schema";
import { NotificationsService } from "../notifications/notifications.service";
import { DEFAULT_CATEGORIES } from "../../seeds/default-categories";

@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel(Budget.name) private budgetModel: Model<Budget>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findByMonth(userId: string, month: number, year: number) {
    let categories = await this.categoryModel.find({
      $or: [{ userId }, { userId: null }],
      isActive: true,
      type: "expense",
    });

    // If user has no categories, seed them with defaults
    if (categories.length === 0) {
      await this.categoryModel.insertMany(
        DEFAULT_CATEGORIES.map((cat) => ({
          ...cat,
          userId,
          isDefault: true,
          isActive: true,
        })),
      );
      categories = await this.categoryModel.find({
        userId,
        isActive: true,
        type: "expense",
      });
    }

    const budgets = await Promise.all(
      categories.map(async (cat) => {
        // 1. Find or create the budget record
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

        // 2. RECALCULATE spentAmount from actual transactions (The Source of Truth)
        const transactionsResult = await this.transactionModel.aggregate([
          {
            $match: {
              userId: { $in: [userId.toString(), new Types.ObjectId(userId)] },
              categoryId: { $in: [cat._id.toString(), cat._id] },
              type: "expense",
              month: Number(month),
              year: Number(year),
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        const actualSpent = transactionsResult.length > 0 ? transactionsResult[0].total : 0;

        // Update DB if it differs (optional but good for consistency)
        if (budget.spentAmount !== actualSpent) {
          budget.spentAmount = actualSpent;
          await budget.save();
        }

        return budget.populate("categoryId");
      }),
    );

    return budgets;
  }

  async updateLimit(
    userId: string,
    categoryId: string,
    month: number,
    year: number,
    limitAmount: number,
  ) {
    const budget = await this.budgetModel.findOneAndUpdate(
      { userId, categoryId, month, year },
      { $set: { limitAmount } },
      { new: true, upsert: true },
    );
    return budget;
  }

  async updateSpentAmount(
    userId: string,
    categoryId: string,
    month: number,
    year: number,
    amountDelta: number,
  ) {
    const budget = await this.budgetModel.findOneAndUpdate(
      { userId, categoryId, month, year },
      { $inc: { spentAmount: amountDelta } },
      { new: true, upsert: true },
    );

    await this.notificationsService.checkBudgetAlerts(
      userId,
      categoryId,
      month,
      year,
    );

    return budget;
  }
}
