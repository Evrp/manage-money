import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./modules/auth/auth.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";
import { BudgetsModule } from "./modules/budgets/budgets.module";
import { SlipsModule } from "./modules/slips/slips.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { WebhookModule } from "./modules/webhook/webhook.module";
import { FirebaseModule } from "./modules/firebase/firebase.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI as string, {
      serverSelectionTimeoutMS: 10000, // รอ 10 วิ ถ้าเลือก Server ไม่ได้
      connectTimeoutMS: 10000, // รอ 10 วิ ตอนต่อครั้งแรก
    }),
    FirebaseModule,
    AuthModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    SlipsModule,
    DashboardModule,
    NotificationsModule,
    WebhookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
