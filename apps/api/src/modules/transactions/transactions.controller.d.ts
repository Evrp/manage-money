import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { QueryTransactionDto } from "./dto/query-transaction.dto";
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    findAll(req: any, query: QueryTransactionDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("../../schemas/transaction.schema").Transaction, {}, {}> & import("../../schemas/transaction.schema").Transaction & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    getSummary(req: any, month: number, year: number): Promise<{
        income: number;
        expense: number;
        net: number;
    }>;
    create(req: any, createTransactionDto: CreateTransactionDto): Promise<Omit<import("mongoose").Document<unknown, {}, import("../../schemas/transaction.schema").Transaction, {}, {}> & import("../../schemas/transaction.schema").Transaction & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, never>>;
    remove(req: any, id: string): Promise<{
        success: boolean;
    }>;
    update(id: string, req: any, updateData: any): Promise<import("mongoose").Document<unknown, {}, import("../../schemas/transaction.schema").Transaction, {}, {}> & import("../../schemas/transaction.schema").Transaction & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
}
