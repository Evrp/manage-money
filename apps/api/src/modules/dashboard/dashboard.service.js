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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const transaction_schema_1 = require("../../schemas/transaction.schema");
let DashboardService = class DashboardService {
    constructor(transactionModel) {
        this.transactionModel = transactionModel;
    }
    async getSummary(userId, month, year) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const transactions = await this.transactionModel.aggregate([
            {
                $match: {
                    userId: { $in: [userId, userObjectId] },
                    month: Number(month),
                    year: Number(year),
                },
            },
            {
                $group: {
                    _id: "$type",
                    total: { $sum: "$amount" },
                },
            },
        ]);
        const income = transactions.find((t) => t._id === "income")?.total || 0;
        const expense = transactions.find((t) => t._id === "expense")?.total || 0;
        const netSaving = income - expense;
        const savingRate = income > 0 ? (netSaving / income) * 100 : 0;
        // Top categories
        const topCategories = await this.transactionModel.aggregate([
            {
                $match: {
                    userId: { $in: [userId, userObjectId] },
                    month: Number(month),
                    year: Number(year),
                    type: "expense",
                },
            },
            {
                $addFields: {
                    categoryIdObj: {
                        $cond: {
                            if: { $eq: [{ $type: "$categoryId" }, "string"] },
                            then: { $toObjectId: "$categoryId" },
                            else: "$categoryId",
                        },
                    },
                },
            },
            {
                $group: {
                    _id: "$categoryIdObj",
                    total: { $sum: "$amount" },
                },
            },
            { $sort: { total: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "category",
                },
            },
            { $unwind: "$category" },
            {
                $project: {
                    name: "$category.name",
                    amount: "$total",
                    icon: "$category.icon",
                    color: "$category.color",
                },
            },
        ]);
        return {
            totalIncome: income,
            totalExpense: expense,
            netSaving,
            savingRate,
            topCategories,
        };
    }
    async getMonthlyChart(userId, year) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const data = await this.transactionModel.aggregate([
            {
                $match: {
                    userId: { $in: [userId, userObjectId] },
                    year: Number(year),
                },
            },
            {
                $group: {
                    _id: { month: "$month", type: "$type" },
                    total: { $sum: "$amount" },
                },
            },
            { $sort: { "_id.month": 1 } },
        ]);
        const months = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            income: 0,
            expense: 0,
        }));
        data.forEach((item) => {
            const m = months.find((m) => m.month === item._id.month);
            if (m) {
                if (item._id.type === "income")
                    m.income = item.total;
                if (item._id.type === "expense")
                    m.expense = item.total;
            }
        });
        return months;
    }
    async getCategoryBreakdown(userId, month, year) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        return this.transactionModel.aggregate([
            {
                $match: {
                    userId: { $in: [userId, userObjectId] },
                    month: Number(month),
                    year: Number(year),
                    type: "expense",
                },
            },
            {
                $addFields: {
                    categoryIdObj: {
                        $cond: {
                            if: { $eq: [{ $type: "$categoryId" }, "string"] },
                            then: { $toObjectId: "$categoryId" },
                            else: "$categoryId",
                        },
                    },
                },
            },
            {
                $group: {
                    _id: "$categoryIdObj",
                    total: { $sum: "$amount" },
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "category",
                },
            },
            { $unwind: "$category" },
            {
                $project: {
                    name: "$category.name",
                    value: "$total",
                    color: "$category.color",
                    icon: "$category.icon",
                },
            },
        ]);
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map