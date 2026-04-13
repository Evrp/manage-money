import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { TransactionType, ITransaction, ISlipData } from "@moneyflow/shared";

@Schema({ timestamps: true })
export class Transaction extends Document implements ITransaction {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: string;

  @Prop({ type: Types.ObjectId, ref: "Category", required: true })
  categoryId: string;

  @Prop({ type: String, enum: TransactionType, required: true })
  type: TransactionType;

  @Prop({ required: true })
  amount: number;

  @Prop()
  description?: string;

  @Prop()
  note?: string;

  @Prop({ required: true, index: true })
  date: Date;

  @Prop({ required: true })
  month: number;

  @Prop({ required: true })
  year: number;

  @Prop()
  slipImageUrl?: string;

  @Prop({ type: Object })
  slipData?: ISlipData;

  @Prop({ default: false })
  isAutoImported: boolean;

  @Prop()
  aiConfidence?: number;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ userId: 1, year: 1, month: 1 });
