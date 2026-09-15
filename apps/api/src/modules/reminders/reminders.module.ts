import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { NotificationsModule } from "../notifications/notifications.module";
import {
  RecurringExpense,
  RecurringExpenseSchema,
} from "../../schemas/recurring-expense.schema";
import { User, UserSchema } from "../../schemas/user.schema";
import { Category, CategorySchema } from "../../schemas/category.schema";
import { RemindersController } from "./reminders.controller";
import { RemindersService } from "./reminders.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RecurringExpense.name, schema: RecurringExpenseSchema },
      { name: User.name, schema: UserSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
    NotificationsModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService],
})
export class RemindersModule {}
