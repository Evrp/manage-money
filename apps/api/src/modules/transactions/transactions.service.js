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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const transaction_schema_1 = require("../../schemas/transaction.schema");
const budgets_service_1 = require("../budgets/budgets.service");
const firebase_service_1 = require("../firebase/firebase.service");
let TransactionsService = class TransactionsService {
    constructor(transactionModel, budgetsService, firebaseService) {
        this.transactionModel = transactionModel;
        this.budgetsService = budgetsService;
        this.firebaseService = firebaseService;
    }
    async findAll(userId, query) {
        const { month, year, categoryId, type, page = 1, limit = 20 } = query;
        const filter = { userId };
        if (month && year) {
            filter.month = month;
            filter.year = year;
        }
        if (categoryId)
            filter.categoryId = categoryId;
        if (type)
            filter.type = type;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.transactionModel
                .find(filter)
                .populate("categoryId") // Populate the full category object
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.transactionModel.countDocuments(filter),
        ]);
        return { data, total, page, limit };
    }
    async create(userId, createTransactionDto) {
        const date = new Date(createTransactionDto.date);
        const transaction = new this.transactionModel({
            ...createTransactionDto,
            userId: new mongoose_2.Types.ObjectId(userId),
            categoryId: new mongoose_2.Types.ObjectId(createTransactionDto.categoryId),
            date,
            month: date.getMonth() + 1,
            year: date.getFullYear(),
        });
        const saved = await transaction.save();
        const categoryId = saved.categoryId.toString();
        // Populate directly on the document for immediate consistency
        const populated = await saved.populate("categoryId");
        if (saved.type === "expense") {
            await this.budgetsService.updateSpentAmount(userId, categoryId, saved.month, saved.year, saved.amount);
        }
        return populated;
    }
    async remove(userId, id) {
        const transaction = await this.transactionModel.findOne({
            _id: id,
            userId,
        });
        if (!transaction) {
            throw new common_1.NotFoundException("Transaction not found");
        }
        // 1. Delete image from storage if it exists
        if (transaction.slipImageUrl) {
            await this.firebaseService.deleteFileFromUrl(transaction.slipImageUrl);
        }
        // 2. Delete from database
        await this.transactionModel.deleteOne({ _id: id });
        // 3. Update budget
        if (transaction.type === "expense" && transaction.categoryId) {
            const catId = typeof transaction.categoryId === "object"
                ? transaction.categoryId._id
                : transaction.categoryId;
            await this.budgetsService.updateSpentAmount(userId, catId.toString(), transaction.month, transaction.year, -transaction.amount);
        }
        return { success: true };
    }
    async update(userId, id, updateData) {
        const oldTransaction = await this.transactionModel.findOne({
            _id: id,
            userId,
        });
        if (!oldTransaction) {
            throw new common_1.NotFoundException("Transaction not found");
        }
        // Prepare date fields if date changed
        if (updateData.date) {
            const date = new Date(updateData.date);
            updateData.month = date.getMonth() + 1;
            updateData.year = date.getFullYear();
        }
        // 1. Revert budget for old transaction if it was an expense
        if (oldTransaction.type === "expense" && oldTransaction.categoryId) {
            const oldCatId = typeof oldTransaction.categoryId === "object"
                ? oldTransaction.categoryId._id
                : oldTransaction.categoryId;
            await this.budgetsService.updateSpentAmount(userId, oldCatId.toString(), oldTransaction.month, oldTransaction.year, -oldTransaction.amount);
        }
        // 2. Update transaction
        if (updateData.categoryId) {
            updateData.categoryId = new mongoose_2.Types.ObjectId(updateData.categoryId);
        }
        const newTransaction = await this.transactionModel.findOneAndUpdate({ _id: id, userId: new mongoose_2.Types.ObjectId(userId) }, { $set: updateData }, { new: true });
        // 3. Apply budget for new transaction if it is an expense
        if (newTransaction &&
            newTransaction.type === "expense" &&
            newTransaction.categoryId) {
            const newCatId = typeof newTransaction.categoryId === "object"
                ? newTransaction.categoryId._id
                : newTransaction.categoryId;
            await this.budgetsService.updateSpentAmount(userId, newCatId.toString(), newTransaction.month, newTransaction.year, newTransaction.amount);
        }
        return newTransaction;
    }
    async getSummary(userId, month, year) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const summary = await this.transactionModel.aggregate([
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
        const result = {
            income: 0,
            expense: 0,
            net: 0,
        };
        summary.forEach((s) => {
            if (s._id === "income")
                result.income = s.total;
            if (s._id === "expense")
                result.expense = s.total;
        });
        result.net = result.income - result.expense;
        return result;
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        budgets_service_1.BudgetsService,
        firebase_service_1.FirebaseService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map