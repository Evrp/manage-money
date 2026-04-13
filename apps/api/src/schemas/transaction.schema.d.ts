import { Document, Types } from "mongoose";
import { TransactionType, ITransaction, ISlipData } from "@moneyflow/shared";
export declare class Transaction extends Document implements ITransaction {
    userId: string;
    categoryId: string;
    type: TransactionType;
    amount: number;
    description?: string;
    note?: string;
    date: Date;
    month: number;
    year: number;
    slipImageUrl?: string;
    slipData?: ISlipData;
    isAutoImported: boolean;
    aiConfidence?: number;
}
export declare const TransactionSchema: import("mongoose").Schema<Transaction, import("mongoose").Model<Transaction, any, any, any, Document<unknown, any, Transaction, any, {}> & Transaction & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Transaction, Document<unknown, {}, import("mongoose").FlatRecord<Transaction>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Transaction> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
