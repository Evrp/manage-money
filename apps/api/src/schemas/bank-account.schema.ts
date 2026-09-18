import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { IBankAccount } from "@moneyflow/shared";

@Schema({ timestamps: true })
export class BankAccount extends Document implements IBankAccount {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: string;

  @Prop({ required: true, trim: true, maxlength: 60 })
  name: string;

  @Prop({ required: true, trim: true, maxlength: 60 })
  bankName: string;

  // Store only the final four digits; never persist a full bank account number.
  @Prop({ match: /^\d{4}$/ })
  last4?: string;

  @Prop({ default: "#0f766e" })
  color: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const BankAccountSchema = SchemaFactory.createForClass(BankAccount);
BankAccountSchema.index({ userId: 1, name: 1 }, { unique: true });
