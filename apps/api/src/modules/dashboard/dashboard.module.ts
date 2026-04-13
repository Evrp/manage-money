import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DashboardService } from "./dashboard.service";
import { DashboardController } from "./dashboard.controller";
import {
  Transaction,
  TransactionSchema,
} from "../../schemas/transaction.schema";
import { Category, CategorySchema } from "../../schemas/category.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
