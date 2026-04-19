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
      page = 1,
      limit = 20,
      order = "desc",
    } = query;
    const userObjectId = new Types.ObjectId(userId);
    const filter: any = {
      userId: { $in: [userId, userObjectId] },
    };

    if (month && year) {
      filter.month = month;
      filter.year = year;
    }
    if (categoryId) {
      filter.categoryId = { $in: [categoryId, new Types.ObjectId(categoryId)] };
    }
    if (type) filter.type = type;

    const skip = (page - 1) * limit;
    const sortOrder = order === "asc" ? 1 : -1;

    const [data, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .populate("categoryId") // Populate the full category object
        .sort({ date: sortOrder, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(filter),
    ]);

    const refreshedData = await this.refreshSlipUrls(data);
    return { data: refreshedData, total, page, limit, order };
  }

  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    const date = new Date(createTransactionDto.date);

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
      month: date.getMonth() + 1,
      year: date.getFullYear(),
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
    const transaction = await this.transactionModel.findOne({
      _id: id,
      userId,
    });
    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    // 1. Delete image from storage if it exists
    if (transaction.slipImageUrl) {
      await this.firebaseService.deleteFileFromUrl(transaction.slipImageUrl);
    }

    // 2. Delete from database
    await this.transactionModel.deleteOne({ _id: id });

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
    const oldTransaction = await this.transactionModel.findOne({
      _id: id,
      userId,
    });
    if (!oldTransaction) {
      throw new NotFoundException("Transaction not found");
    }

    // Prepare date fields if date changed
    if (updateData.date) {
      const date = new Date(updateData.date);
      updateData.month = date.getMonth() + 1;
      updateData.year = date.getFullYear();
    }

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
      { _id: id, userId: new Types.ObjectId(userId) },
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
