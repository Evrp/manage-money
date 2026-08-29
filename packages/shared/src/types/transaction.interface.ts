export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

import { PaymentMethod } from './credit-card.interface';

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
  paymentMethod?: PaymentMethod;
  creditCardId?: string;
  statementMonth?: number;
  statementYear?: number;
  isNextMonthCycle?: boolean;
  targetMonth?: number;
  targetYear?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
