export declare enum SlipUploadStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    SUCCESS = "success",
    FAILED = "failed"
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
