import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { ICreditCard } from "@moneyflow/shared";

@Schema({ timestamps: true })
export class CreditCard extends Document implements ICreditCard {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  issuer: string;

  // Never store PAN, CVV, track data, or a card token in MoneyFlow.
  @Prop({ required: true, match: /^\d{4}$/ })
  last4: string;

  @Prop({ required: true, min: 0 })
  creditLimit: number;

  @Prop({ required: true, min: 1, max: 31 })
  statementClosingDay: number;

  @Prop({ required: true, min: 1, max: 31 })
  paymentDueDay: number;

  @Prop({ default: "#1A1F36" })
  color: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const CreditCardSchema = SchemaFactory.createForClass(CreditCard);
CreditCardSchema.index({ userId: 1, name: 1 }, { unique: true });
