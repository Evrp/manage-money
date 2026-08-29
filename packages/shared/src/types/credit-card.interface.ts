export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
}

export enum CreditCardStatementStatus {
  OPEN = 'open',
  DUE = 'due',
  PAID = 'paid',
}

export interface ICreditCard {
  _id?: any;
  userId: string;
  name: string;
  issuer: string;
  last4: string;
  creditLimit: number;
  statementClosingDay: number;
  paymentDueDay: number;
  color: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreditCardPayment {
  _id?: any;
  userId: string;
  creditCardId: string;
  statementMonth: number;
  statementYear: number;
  amount: number;
  paidAt: Date | string;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
