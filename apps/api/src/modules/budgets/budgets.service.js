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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const budget_schema_1 = require("../../schemas/budget.schema");
const category_schema_1 = require("../../schemas/category.schema");
const transaction_schema_1 = require("../../schemas/transaction.schema");
const notifications_service_1 = require("../notifications/notifications.service");
const default_categories_1 = require("../../seeds/default-categories");
let BudgetsService = class BudgetsService {
    constructor(budgetModel, categoryModel, transactionModel, notificationsService) {
        this.budgetModel = budgetModel;
        this.categoryModel = categoryModel;
        this.transactionModel = transactionModel;
        this.notificationsService = notificationsService;
    }
    async findByMonth(userId, month, year) {
        let categories = await this.categoryModel.find({
            $or: [{ userId }, { userId: null }],
            isActive: true,
            type: "expense",
        });
        // If user has no categories, seed them with defaults
        if (categories.length === 0) {
            await this.categoryModel.insertMany(default_categories_1.DEFAULT_CATEGORIES.map((cat) => ({
                ...cat,
                userId,
                isDefault: true,
                isActive: true,
            })));
            categories = await this.categoryModel.find({
                userId,
                isActive: true,
                type: "expense",
            });
        }
        const budgets = await Promise.all(categories.map(async (cat) => {
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
                        userId: { $in: [userId.toString(), new mongoose_2.Types.ObjectId(userId)] },
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
        }));
        return budgets;
    }
    async updateLimit(userId, categoryId, month, year, limitAmount) {
        const budget = await this.budgetModel.findOneAndUpdate({ userId, categoryId, month, year }, { $set: { limitAmount } }, { new: true, upsert: true });
        return budget;
    }
    async updateSpentAmount(userId, categoryId, month, year, amountDelta) {
        const budget = await this.budgetModel.findOneAndUpdate({ userId, categoryId, month, year }, { $inc: { spentAmount: amountDelta } }, { new: true, upsert: true });
        await this.notificationsService.checkBudgetAlerts(userId, categoryId, month, year);
        return budget;
    }
};
exports.BudgetsService = BudgetsService;
exports.BudgetsService = BudgetsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(budget_schema_1.Budget.name)),
    __param(1, (0, mongoose_1.InjectModel)(category_schema_1.Category.name)),
    __param(2, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        notifications_service_1.NotificationsService])
], BudgetsService);
//# sourceMappingURL=budgets.service.js.map