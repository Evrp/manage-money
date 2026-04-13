import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Theme, IUser } from "@moneyflow/shared";

@Schema({ timestamps: true })
export class User extends Document implements IUser {
  @Prop({ required: true, unique: true, index: true })
  lineUserId: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true })
  pictureUrl: string;

  @Prop()
  email?: string;

  @Prop({ type: String, enum: Theme, default: Theme.LIGHT })
  theme: Theme;

  @Prop({ default: "THB" })
  currency: string;

  @Prop()
  monthlyBudget?: number;

  @Prop({ default: 0 })
  financialScore: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
