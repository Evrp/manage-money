import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { CategoryType, ICategory } from "@moneyflow/shared";

@Schema({ timestamps: true })
export class Category extends Document implements ICategory {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: CategoryType, required: true })
  type: CategoryType;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  color: string;

  @Prop()
  monthlyLimit?: number;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
// A name may be reused between income and expense categories, but remains
// unique within the same type for each user.
CategorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });
