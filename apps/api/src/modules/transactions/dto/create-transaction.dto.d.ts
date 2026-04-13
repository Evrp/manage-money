import { TransactionType } from "@moneyflow/shared";
export declare class CreateTransactionDto {
    categoryId: string;
    type: TransactionType;
    amount: number;
    description?: string;
    note?: string;
    date: string;
    slipImageUrl?: string;
}
