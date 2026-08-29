import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TransactionsService } from "./transactions.service";
import { TransactionsController } from "./transactions.controller";
import {
  Transaction,
  TransactionSchema,
} from "../../schemas/transaction.schema";
import { Category, CategorySchema } from "../../schemas/category.schema";
import { BudgetsModule } from "../budgets/budgets.module";
import { CreditCardsModule } from "../credit-cards/credit-cards.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
    BudgetsModule,
    CreditCardsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
