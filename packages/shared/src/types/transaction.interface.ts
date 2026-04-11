export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export interface ISlipData {
  fromBank?: string;
  toBank?: string;
  toAccount?: string;
  toName?: string;
  referenceNo?: string;
  rawText?: string;
}

export interface ITransaction {
  _id?: any;
  userId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description?: string;
  note?: string;
  date: Date | string;
  month: number;
  year: number;
  slipImageUrl?: string;
  slipData?: ISlipData;
  isAutoImported: boolean;
  aiConfidence?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
