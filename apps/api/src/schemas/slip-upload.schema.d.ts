import { Document, Types } from "mongoose";
import { SlipUploadStatus, ISlipUpload } from "@moneyflow/shared";
export declare class SlipUpload extends Document implements ISlipUpload {
    userId: string;
    imageUrl: string;
    status: SlipUploadStatus;
    extractedData?: any;
    transactionId?: string;
    errorMessage?: string;
    processedAt?: Date;
}
export declare const SlipUploadSchema: import("mongoose").Schema<SlipUpload, import("mongoose").Model<SlipUpload, any, any, any, Document<unknown, any, SlipUpload, any, {}> & SlipUpload & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SlipUpload, Document<unknown, {}, import("mongoose").FlatRecord<SlipUpload>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<SlipUpload> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
