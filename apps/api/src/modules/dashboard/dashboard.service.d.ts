import { Model } from "mongoose";
import { Transaction } from "../../schemas/transaction.schema";
export declare class DashboardService {
    private transactionModel;
    constructor(transactionModel: Model<Transaction>);
    getSummary(userId: string, month: number, year: number): Promise<{
        totalIncome: any;
        totalExpense: any;
        netSaving: number;
        savingRate: number;
        topCategories: any[];
    }>;
    getMonthlyChart(userId: string, year: number): Promise<{
        month: number;
        income: number;
        expense: number;
    }[]>;
    getCategoryBreakdown(userId: string, month: number, year: number): Promise<any[]>;
}
