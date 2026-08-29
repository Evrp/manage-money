import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Transaction } from "../../schemas/transaction.schema";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { QueryTransactionDto } from "./dto/query-transaction.dto";
import { BudgetsService } from "../budgets/budgets.service";
import { FirebaseService } from "../firebase/firebase.service";
import { CreditCardsService } from "../credit-cards/credit-cards.service";
import { PaymentMethod } from "@moneyflow/shared";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    private readonly budgetsService: BudgetsService,
    private readonly firebaseService: FirebaseService,
    private readonly creditCardsService: CreditCardsService,
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
    const creditCardFields = await this.resolveCreditCardFields(userId, createTransactionDto, date);
    const { month, year } = creditCardFields.paymentMethod === PaymentMethod.CREDIT_CARD
      ? this.calculateCycleMonthYear(date)
      : this.calculateCycleMonthYear(date, createTransactionDto.isNextMonthCycle, createTransactionDto.targetMonth, createTransactionDto.targetYear);

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
      ...creditCardFields,
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

  async update(userId: string, id: string, updateData: UpdateTransactionDto) {
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

    const creditCardFields = await this.resolveCreditCardFields(userId, updateData, targetDate, oldTransaction);
    const { month, year } = creditCardFields.paymentMethod === PaymentMethod.CREDIT_CARD
      ? this.calculateCycleMonthYear(targetDate)
      : this.calculateCycleMonthYear(targetDate, isNext, tMonth, tYear);
    const payloadToSet: any = { ...updateData, month, year, ...creditCardFields };

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
    if (payloadToSet.categoryId) {
      payloadToSet.categoryId = new Types.ObjectId(payloadToSet.categoryId);
    }

    // Extract path from imageUrl if it is a full URL
    if (payloadToSet.slipImageUrl) {
      const path = this.firebaseService.extractPathFromUrl(
        payloadToSet.slipImageUrl,
      );
      if (path) payloadToSet.slipImageUrl = path;
    }

    const updateOperation: any = { $set: payloadToSet };
    if (creditCardFields.paymentMethod !== PaymentMethod.CREDIT_CARD) {
      delete payloadToSet.creditCardId;
      delete payloadToSet.statementMonth;
      delete payloadToSet.statementYear;
      updateOperation.$unset = { creditCardId: 1, statementMonth: 1, statementYear: 1 };
    }

    const newTransaction = await this.transactionModel.findOneAndUpdate(
      queryFilter,
      updateOperation,
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

  private async resolveCreditCardFields(
    userId: string,
    data: { paymentMethod?: PaymentMethod; creditCardId?: string },
    date: Date,
    existing?: Transaction,
  ) {
    const paymentMethod = data.paymentMethod ?? existing?.paymentMethod ?? PaymentMethod.CASH;
    const existingCardId = existing?.creditCardId?.toString();
    const creditCardId = data.creditCardId ?? existingCardId;
    if (paymentMethod !== PaymentMethod.CREDIT_CARD) return { paymentMethod };
    if (!creditCardId) throw new BadRequestException("creditCardId is required for credit-card transactions");
    const card = await this.creditCardsService.getOwnedCard(userId, creditCardId);
    const { statementMonth, statementYear } = this.creditCardsService.resolveStatementPeriod(card, date);
    return { paymentMethod, creditCardId: new Types.ObjectId(creditCardId), statementMonth, statementYear };
  }
}
