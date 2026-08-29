import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class CreditCardStatement extends Document {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: string;
  @Prop({
    type: Types.ObjectId,
    ref: "CreditCard",
    required: true,
    index: true,
  })
  creditCardId: string;
  @Prop({ required: true, min: 1, max: 12 }) statementMonth: number;
  @Prop({ required: true, min: 2000 }) statementYear: number;
  @Prop({ required: true }) dueDate: Date;
}

export const CreditCardStatementSchema =
  SchemaFactory.createForClass(CreditCardStatement);
CreditCardStatementSchema.index(
  { userId: 1, creditCardId: 1, statementYear: 1, statementMonth: 1 },
  { unique: true },
);
