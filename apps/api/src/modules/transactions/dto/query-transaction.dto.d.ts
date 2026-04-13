import { TransactionType } from "@moneyflow/shared";
export declare class QueryTransactionDto {
    month?: number;
    year?: number;
    categoryId?: string;
    type?: TransactionType;
    page?: number;
    limit?: number;
}
