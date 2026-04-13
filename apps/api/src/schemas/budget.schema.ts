import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { IBudget } from "@moneyflow/shared";

@Schema({ timestamps: true })
export class Budget extends Document implements IBudget {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: string;

  @Prop({ type: Types.ObjectId, ref: "Category", required: true })
  categoryId: string;

  @Prop({ required: true })
  month: number;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  limitAmount: number;

  @Prop({ default: 0 })
  spentAmount: number;

  @Prop({ default: false })
  alertSent80: boolean;

  @Prop({ default: false })
  alertSent90: boolean;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
BudgetSchema.index(
  { userId: 1, categoryId: 1, month: 1, year: 1 },
  { unique: true },
);
