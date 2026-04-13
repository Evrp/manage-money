import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SlipsService } from "./slips.service";
import { SlipsController } from "./slips.controller";
import { SlipUpload, SlipUploadSchema } from "../../schemas/slip-upload.schema";
import { TransactionsModule } from "../transactions/transactions.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SlipUpload.name, schema: SlipUploadSchema },
    ]),
    TransactionsModule,
  ],
  controllers: [SlipsController],
  providers: [SlipsService],
  exports: [SlipsService],
})
export class SlipsModule {}
