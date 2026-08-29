import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CreditCardsController } from "./credit-cards.controller";
import { CreditCardsService } from "./credit-cards.service";
import { CreditCard, CreditCardSchema } from "../../schemas/credit-card.schema";
import {
  CreditCardPayment,
  CreditCardPaymentSchema,
} from "../../schemas/credit-card-payment.schema";
import {
  Transaction,
  TransactionSchema,
} from "../../schemas/transaction.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CreditCard.name, schema: CreditCardSchema },
      { name: CreditCardPayment.name, schema: CreditCardPaymentSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [CreditCardsController],
  providers: [CreditCardsService],
  exports: [CreditCardsService],
})
export class CreditCardsModule {}
