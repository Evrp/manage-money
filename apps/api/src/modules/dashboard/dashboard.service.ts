import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Transaction } from "../../schemas/transaction.schema";

export type AnalyticsBasis = "budget" | "transaction";

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
  ) {}

  private getPeriodMatch(month: number, year: number, basis: AnalyticsBasis) {
    if (basis === "budget") return { month: Number(month), year: Number(year) };

    return {
      date: {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1),
      },
    };
  }

  async getSummary(
    userId: string,
    month: number,
    year: number,
    basis: AnalyticsBasis = "budget",
  ) {
    const userObjectId = new Types.ObjectId(userId);
    const periodMatch = this.getPeriodMatch(month, year, basis);
    const transactions = await this.transactionModel.aggregate([
      {
        $match: {
          userId: { $in: [userId, userObjectId] },
          ...periodMatch,
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
          ...periodMatch,
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

  async getMonthlyChart(
    userId: string,
    year: number,
    basis: AnalyticsBasis = "budget",
  ) {
    const userObjectId = new Types.ObjectId(userId);
    const match =
      basis === "budget"
        ? { year: Number(year) }
        : {
            date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) },
          };
    const data = await this.transactionModel.aggregate([
      {
        $match: {
          userId: { $in: [userId, userObjectId] },
          ...match,
        },
      },
      {
        $group: {
          _id: {
            month: basis === "budget" ? "$month" : { $month: "$date" },
            type: "$type",
          },
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
        if (item._id.type === "income") m.income = item.total;
        if (item._id.type === "expense") m.expense = item.total;
      }
    });

    return months;
  }

  async getCategoryBreakdown(
    userId: string,
    month: number,
    year: number,
    transactionType: string,
    basis: AnalyticsBasis = "budget",
  ) {
    const userObjectId = new Types.ObjectId(userId);
    // Explicitly set the filter type to ensure no leakage
    const reqType = transactionType === "income" ? "income" : "expense";
    const periodMatch = this.getPeriodMatch(month, year, basis);

    const results = await this.transactionModel.aggregate([
      {
        $match: {
          userId: { $in: [userId, userObjectId] },
          ...periodMatch,
          type: reqType,
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
      { $sort: { value: -1 } },
    ]);

    return {
      debug: {
        receivedType: transactionType,
        determinedType: reqType,
        basis,
        userId,
      },
      data: results,
    };
  }
}
