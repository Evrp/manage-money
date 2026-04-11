import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction } from '../../schemas/transaction.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
  ) {}

  async getSummary(userId: string, month: number, year: number) {
    const transactions = await this.transactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), month, year } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const income = transactions.find((t) => t._id === 'income')?.total || 0;
    const expense = transactions.find((t) => t._id === 'expense')?.total || 0;
    const netSaving = income - expense;
    const savingRate = income > 0 ? (netSaving / income) * 100 : 0;

    // Top categories
    const topCategories = await this.transactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), month, year, type: 'expense' } },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      { $sort: { total: -1 } },
      { $limit: 5 },
      {
        $project: {
          name: '$category.name',
          icon: '$category.icon',
          color: '$category.color',
          amount: '$total',
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

  async getMonthlyChart(userId: string, year: number) {
    const data = await this.transactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), year } },
      {
        $group: {
          _id: { month: '$month', type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
    }));

    data.forEach((item) => {
      const m = months.find((m) => m.month === item._id.month);
      if (m) {
        if (item._id.type === 'income') m.income = item.total;
        if (item._id.type === 'expense') m.expense = item.total;
      }
    });

    return months;
  }

  async getCategoryBreakdown(userId: string, month: number, year: number) {
    return this.transactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), month, year, type: 'expense' } },
      {
        $group: {
          _id: '$categoryId',
          value: { $sum: '$amount' },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          name: '$category.name',
          value: 1,
          color: '$category.color',
        },
      },
    ]);
  }
}
