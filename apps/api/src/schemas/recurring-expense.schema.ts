import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { IRecurringExpense } from "@moneyflow/shared";

@Schema({ timestamps: true })
export class RecurringExpense extends Document implements IRecurringExpense {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: string;

  @Prop({ type: Types.ObjectId, ref: "Category" })
  categoryId?: string;

  @Prop({ required: true, trim: true, maxlength: 80 })
  name: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, min: 1, max: 31 })
  dueDay: number;

  @Prop({ default: "00:00", match: /^([01]\d|2[0-3]):[0-5]\d$/ })
  reminderTime: string;

  @Prop({ default: true })
  enabled: boolean;

  @Prop()
  lastReminderKey?: string;

  @Prop()
  deliveryClaimKey?: string;
}

export const RecurringExpenseSchema =
  SchemaFactory.createForClass(RecurringExpense);
RecurringExpenseSchema.index({ enabled: 1, reminderTime: 1 });
RecurringExpenseSchema.index({ userId: 1, dueDay: 1 });
