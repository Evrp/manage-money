import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { ICreditCardPayment } from "@moneyflow/shared";

@Schema({ timestamps: true })
export class CreditCardPayment extends Document implements ICreditCardPayment {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: string;

  @Prop({
    type: Types.ObjectId,
    ref: "CreditCard",
    required: true,
    index: true,
  })
  creditCardId: string;

  @Prop({ required: true, min: 1, max: 12 })
  statementMonth: number;

  @Prop({ required: true, min: 2000 })
  statementYear: number;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true })
  paidAt: Date;

  @Prop({ trim: true, maxlength: 500 })
  note?: string;
}

export const CreditCardPaymentSchema =
  SchemaFactory.createForClass(CreditCardPayment);
CreditCardPaymentSchema.index({
  userId: 1,
  creditCardId: 1,
  statementYear: 1,
  statementMonth: 1,
});
