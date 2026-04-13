import { SlipsService } from "./slips.service";
import { CreateTransactionDto } from "../transactions/dto/create-transaction.dto";
export declare class SlipsController {
    private readonly slipsService;
    constructor(slipsService: SlipsService);
    upload(req: any, file: Express.Multer.File): Promise<{
        id: import("mongoose").Types.ObjectId;
        imageUrl: string;
        extractedData: any;
    }>;
    uploadOnly(req: any, file: Express.Multer.File): Promise<{
        imageUrl: string;
    }>;
    confirm(req: any, body: {
        slipId: string;
        transactionData: CreateTransactionDto;
    }): Promise<Omit<import("mongoose").Document<unknown, {}, import("../../schemas/transaction.schema").Transaction, {}, {}> & import("../../schemas/transaction.schema").Transaction & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, never>>;
}
