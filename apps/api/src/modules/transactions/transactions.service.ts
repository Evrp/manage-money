import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from '../../schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { BudgetsService } from '../budgets/budgets.service';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    private readonly budgetsService: BudgetsService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async findAll(userId: string, query: QueryTransactionDto) {
    const { month, year, categoryId, type, page = 1, limit = 20 } = query;
    const filter: any = { userId };

    if (month && year) {
      filter.month = month;
      filter.year = year;
    }
    if (categoryId) filter.categoryId = categoryId;
    if (type) filter.type = type;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .populate('categoryId') // Populate the full category object
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    const date = new Date(createTransactionDto.date);
    const transaction = new this.transactionModel({
      ...createTransactionDto,
      userId,
      date,
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    });
    
    const saved = await transaction.save();
    
    // Populate directly on the document for immediate consistency
    const populated = await saved.populate('categoryId');

    if (saved.type === 'expense') {
      await this.budgetsService.updateSpentAmount(
        userId,
        saved.categoryId.toString(),
        saved.month,
        saved.year,
        saved.amount,
      );
    }
    
    return populated;
  }

  async remove(userId: string, id: string) {
    const transaction = await this.transactionModel.findOne({ _id: id, userId });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // 1. Delete image from storage if it exists
    if (transaction.slipImageUrl) {
      await this.firebaseService.deleteFileFromUrl(transaction.slipImageUrl);
    }

    // 2. Delete from database
    await this.transactionModel.deleteOne({ _id: id });

    // 3. Update budget
    if (transaction.type === 'expense') {
      await this.budgetsService.updateSpentAmount(
        userId,
        transaction.categoryId,
        transaction.month,
        transaction.year,
        -transaction.amount,
      );
    }

    return { success: true };
  }

  async getSummary(userId: string, month: number, year: number) {
    const summary = await this.transactionModel.aggregate([
      { $match: { userId, month, year } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const result = {
      income: 0,
      expense: 0,
      net: 0,
    };

    summary.forEach((s) => {
      if (s._id === 'income') result.income = s.total;
      if (s._id === 'expense') result.expense = s.total;
    });

    result.net = result.income - result.expense;
    return result;
  }
}
