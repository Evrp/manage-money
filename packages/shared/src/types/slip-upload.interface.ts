export enum SlipUploadStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export interface ISlipUpload {
  _id?: any;
  userId: string;
  imageUrl: string;
  status: SlipUploadStatus;
  extractedData?: any;
  transactionId?: string;
  errorMessage?: string;
  processedAt?: Date;
  createdAt?: Date;
}

export interface IExtractedCreditCardReceipt {
  documentType?: 'bank_transfer' | 'credit_card_statement' | 'cash_advance' | 'unknown';
  transactionType?: string;
  creditCardLast4?: string;
  cashAdvanceAmount?: number;
  feeAmount?: number;
  receiptInterestRate?: number;
  minimumPaymentRate?: number;
  minimumPaymentAmount?: number;
  statementDueDate?: string;
  confidence?: number;
}
