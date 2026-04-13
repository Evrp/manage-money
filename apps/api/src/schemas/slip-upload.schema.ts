import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { SlipUploadStatus, ISlipUpload } from "@moneyflow/shared";

@Schema({ timestamps: true })
export class SlipUpload extends Document implements ISlipUpload {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({
    type: String,
    enum: SlipUploadStatus,
    default: SlipUploadStatus.PENDING,
  })
  status: SlipUploadStatus;

  @Prop({ type: Object })
  extractedData?: any;

  @Prop({ type: Types.ObjectId, ref: "Transaction" })
  transactionId?: string;

  @Prop()
  errorMessage?: string;

  @Prop()
  processedAt?: Date;
}

export const SlipUploadSchema = SchemaFactory.createForClass(SlipUpload);
