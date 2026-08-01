import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Transaction } from "../../schemas/transaction.schema";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { QueryTransactionDto } from "./dto/query-transaction.dto";
import { BudgetsService } from "../budgets/budgets.service";
import { FirebaseService } from "../firebase/firebase.service";

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    private readonly budgetsService: BudgetsService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async findAll(userId: string, query: QueryTransactionDto) {
    const {
      month,
      year,
      categoryId,
      type,
      uploadDate,
      slipsOnly,
      sortByUpload,
      page = 1,
      limit = 20,
      order = "desc",
    } = query;
    const userObjectId = new Types.ObjectId(userId);
    const filter: any = {
      userId: { $in: [userId, userObjectId] },
    };

    if (!uploadDate) {
      if (month) filter.month = month;
      if (year) filter.year = year;
    }

    if (uploadDate) {
      const start = new Date(uploadDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(uploadDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    if (slipsOnly) {
      filter.slipImageUrl = { $exists: true, $ne: "" };
    }

    if (categoryId) {
      filter.categoryId = {
        $in: [categoryId, new Types.ObjectId(categoryId)],
      };
    }
    if (type) filter.type = type;

    const skip = (page - 1) * limit;
    const sortOrder = order === "asc" ? 1 : -1;
    const sortObj: any = sortByUpload
      ? { createdAt: sortOrder, _id: -1 }
      : { date: sortOrder, createdAt: -1 };

    const [data, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .populate("categoryId")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(filter),
    ]);

    const refreshedData = await this.refreshSlipUrls(data);
    return { data: refreshedData, total, page, limit, order };
  }

  private calculateCycleMonthYear(
    date: Date,
    isNextMonthCycle?: boolean,
    targetMonth?: number,
    targetYear?: number,
  ) {
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    if (isNextMonthCycle) {
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    if (targetMonth) month = Number(targetMonth);
    if (targetYear) year = Number(targetYear);

    return { month, year };
  }

  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    const date = new Date(createTransactionDto.date);
    const { month, year } = this.calculateCycleMonthYear(
      date,
      createTransactionDto.isNextMonthCycle,
      createTransactionDto.targetMonth,
      createTransactionDto.targetYear,
    );

    // Extract path from imageUrl if it is a full URL
    let slipImageUrl = createTransactionDto.slipImageUrl;
    if (slipImageUrl) {
      const path = this.firebaseService.extractPathFromUrl(slipImageUrl);
      if (path) slipImageUrl = path;
    }

    const transaction = new this.transactionModel({
      ...createTransactionDto,
      slipImageUrl,
      userId: new Types.ObjectId(userId),
      categoryId: new Types.ObjectId(createTransactionDto.categoryId),
      date,
      month,
      year,
    });

    const saved = await transaction.save();
    const categoryId = saved.categoryId.toString();

    // Populate directly on the document for immediate consistency
    const populated = await saved.populate("categoryId");

    if (saved.type === "expense") {
      await this.budgetsService.updateSpentAmount(
        userId,
        categoryId,
        saved.month,
        saved.year,
        saved.amount,
      );
    }

    const [refreshed] = await this.refreshSlipUrls([populated]);
    return refreshed;
  }

  async remove(userId: string, id: string) {
    const userObjectId = new Types.ObjectId(userId);
    const transObjectId = Types.ObjectId.isValid(id)
      ? new Types.ObjectId(id)
      : id;
    const queryFilter = {
      _id: { $in: [id, transObjectId] },
      userId: { $in: [userId, userObjectId] },
    };

    const transaction = await this.transactionModel.findOne(queryFilter);
    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    // 1. Delete image from storage if it exists
    if (transaction.slipImageUrl) {
      await this.firebaseService.deleteFileFromUrl(transaction.slipImageUrl);
    }

    // 2. Delete from database
    await this.transactionModel.deleteOne(queryFilter);

    // 3. Update budget
    if (transaction.type === "expense" && transaction.categoryId) {
      const catId =
        typeof transaction.categoryId === "object"
          ? (transaction.categoryId as any)._id
          : transaction.categoryId;
      await this.budgetsService.updateSpentAmount(
        userId,
        catId.toString(),
        transaction.month,
        transaction.year,
        -transaction.amount,
      );
    }

    return { success: true };
  }

  async update(userId: string, id: string, updateData: any) {
    const userObjectId = new Types.ObjectId(userId);
    const transObjectId = Types.ObjectId.isValid(id)
      ? new Types.ObjectId(id)
      : id;
    const queryFilter = {
      _id: { $in: [id, transObjectId] },
      userId: { $in: [userId, userObjectId] },
    };

    const oldTransaction = await this.transactionModel.findOne(queryFilter);
    if (!oldTransaction) {
      throw new NotFoundException("Transaction not found");
    }

    // Prepare date/cycle fields if date or cycle flags changed
    const targetDate = updateData.date
      ? new Date(updateData.date)
      : new Date(oldTransaction.date);
    const isNext =
      updateData.isNextMonthCycle !== undefined
        ? updateData.isNextMonthCycle
        : oldTransaction.isNextMonthCycle;
    const tMonth =
      updateData.targetMonth !== undefined
        ? updateData.targetMonth
        : oldTransaction.targetMonth;
    const tYear =
      updateData.targetYear !== undefined
        ? updateData.targetYear
        : oldTransaction.targetYear;

    const { month, year } = this.calculateCycleMonthYear(
      targetDate,
      isNext,
      tMonth,
      tYear,
    );
    updateData.month = month;
    updateData.year = year;

    // 1. Revert budget for old transaction if it was an expense
    if (oldTransaction.type === "expense" && oldTransaction.categoryId) {
      const oldCatId =
        typeof oldTransaction.categoryId === "object"
          ? (oldTransaction.categoryId as any)._id
          : oldTransaction.categoryId;
      await this.budgetsService.updateSpentAmount(
        userId,
        oldCatId.toString(),
        oldTransaction.month,
        oldTransaction.year,
        -oldTransaction.amount,
      );
    }

    // 2. Update transaction
    if (updateData.categoryId) {
      updateData.categoryId = new Types.ObjectId(updateData.categoryId);
    }

    // Extract path from imageUrl if it is a full URL
    if (updateData.slipImageUrl) {
      const path = this.firebaseService.extractPathFromUrl(
        updateData.slipImageUrl,
      );
      if (path) updateData.slipImageUrl = path;
    }

    const newTransaction = await this.transactionModel.findOneAndUpdate(
      queryFilter,
      { $set: updateData },
      { new: true },
    );

    // 3. Apply budget for new transaction if it is an expense
    if (
      newTransaction &&
      newTransaction.type === "expense" &&
      newTransaction.categoryId
    ) {
      const newCatId =
        typeof newTransaction.categoryId === "object"
          ? (newTransaction.categoryId as any)._id
          : newTransaction.categoryId;
      await this.budgetsService.updateSpentAmount(
        userId,
        newCatId.toString(),
        newTransaction.month,
        newTransaction.year,
        newTransaction.amount,
      );
    }

    if (newTransaction) {
      const [refreshed] = await this.refreshSlipUrls([newTransaction]);
      return refreshed;
    }

    return newTransaction;
  }

  private async refreshSlipUrls(transactions: any[]) {
    return Promise.all(
      transactions.map(async (t) => {
        const doc = t.toObject ? t.toObject() : t;
        if (doc.slipImageUrl) {
          const filePath = this.firebaseService.extractPathFromUrl(
            doc.slipImageUrl,
          );
          if (filePath) {
            try {
              doc.slipImageUrl =
                await this.firebaseService.getSignedUrl(filePath);
            } catch (e) {
              console.error("Failed to refresh slip URL", e);
            }
          }
        }
        return doc;
      }),
    );
  }

  async getSummary(userId: string, month: number, year: number) {
    const userObjectId = new Types.ObjectId(userId);
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
      if (s._id === "income") result.income = s.total;
      if (s._id === "expense") result.expense = s.total;
    });

    result.net = result.income - result.expense;
    return result;
  }
}
