import { Model, Types } from "mongoose";
import { Budget } from "../../schemas/budget.schema";
import { Category } from "../../schemas/category.schema";
import { Transaction } from "../../schemas/transaction.schema";
import { NotificationsService } from "../notifications/notifications.service";
export declare class BudgetsService {
    private budgetModel;
    private categoryModel;
    private transactionModel;
    private readonly notificationsService;
    constructor(budgetModel: Model<Budget>, categoryModel: Model<Category>, transactionModel: Model<Transaction>, notificationsService: NotificationsService);
    findByMonth(userId: string, month: number, year: number): Promise<Omit<import("mongoose").Document<unknown, {}, Budget, {}, {}> & Budget & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, never>[]>;
    updateLimit(userId: string, categoryId: string, month: number, year: number, limitAmount: number): Promise<import("mongoose").Document<unknown, {}, Budget, {}, {}> & Budget & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    updateSpentAmount(userId: string, categoryId: string, month: number, year: number, amountDelta: number): Promise<import("mongoose").Document<unknown, {}, Budget, {}, {}> & Budget & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
}
