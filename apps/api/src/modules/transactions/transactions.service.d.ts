import { Model, Types } from "mongoose";
import { Transaction } from "../../schemas/transaction.schema";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { QueryTransactionDto } from "./dto/query-transaction.dto";
import { BudgetsService } from "../budgets/budgets.service";
import { FirebaseService } from "../firebase/firebase.service";
export declare class TransactionsService {
    private transactionModel;
    private readonly budgetsService;
    private readonly firebaseService;
    constructor(transactionModel: Model<Transaction>, budgetsService: BudgetsService, firebaseService: FirebaseService);
    findAll(userId: string, query: QueryTransactionDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, Transaction, {}, {}> & Transaction & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    create(userId: string, createTransactionDto: CreateTransactionDto): Promise<Omit<import("mongoose").Document<unknown, {}, Transaction, {}, {}> & Transaction & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, never>>;
    remove(userId: string, id: string): Promise<{
        success: boolean;
    }>;
    update(userId: string, id: string, updateData: any): Promise<import("mongoose").Document<unknown, {}, Transaction, {}, {}> & Transaction & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getSummary(userId: string, month: number, year: number): Promise<{
        income: number;
        expense: number;
        net: number;
    }>;
}
