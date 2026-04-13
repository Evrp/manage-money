import { Model } from "mongoose";
import { SlipUpload } from "../../schemas/slip-upload.schema";
import { TransactionsService } from "../transactions/transactions.service";
import { CreateTransactionDto } from "../transactions/dto/create-transaction.dto";
import { FirebaseService } from "../firebase/firebase.service";
export declare class SlipsService {
    private slipUploadModel;
    private readonly transactionsService;
    private readonly firebaseService;
    constructor(slipUploadModel: Model<SlipUpload>, transactionsService: TransactionsService, firebaseService: FirebaseService);
    processUpload(userId: string, file: Express.Multer.File): Promise<{
        id: import("mongoose").Types.ObjectId;
        imageUrl: string;
        extractedData: any;
    }>;
    uploadOnly(userId: string, file: Express.Multer.File): Promise<{
        imageUrl: string;
    }>;
    private uploadToStorage;
    confirm(userId: string, slipId: string, confirmData: CreateTransactionDto): Promise<Omit<import("mongoose").Document<unknown, {}, import("../../schemas/transaction.schema").Transaction, {}, {}> & import("../../schemas/transaction.schema").Transaction & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, never>>;
    private extractWithGemini;
}
