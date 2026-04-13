import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BudgetsService } from "./budgets.service";
import { BudgetsController } from "./budgets.controller";
import { Budget, BudgetSchema } from "../../schemas/budget.schema";
import { Category, CategorySchema } from "../../schemas/category.schema";
import {
  Transaction,
  TransactionSchema,
} from "../../schemas/transaction.schema";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Budget.name, schema: BudgetSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
