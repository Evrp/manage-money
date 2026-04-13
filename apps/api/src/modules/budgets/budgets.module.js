"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const budgets_service_1 = require("./budgets.service");
const budgets_controller_1 = require("./budgets.controller");
const budget_schema_1 = require("../../schemas/budget.schema");
const category_schema_1 = require("../../schemas/category.schema");
const transaction_schema_1 = require("../../schemas/transaction.schema");
const notifications_module_1 = require("../notifications/notifications.module");
let BudgetsModule = class BudgetsModule {
};
exports.BudgetsModule = BudgetsModule;
exports.BudgetsModule = BudgetsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: budget_schema_1.Budget.name, schema: budget_schema_1.BudgetSchema },
                { name: category_schema_1.Category.name, schema: category_schema_1.CategorySchema },
                { name: transaction_schema_1.Transaction.name, schema: transaction_schema_1.TransactionSchema },
            ]),
            notifications_module_1.NotificationsModule,
        ],
        controllers: [budgets_controller_1.BudgetsController],
        providers: [budgets_service_1.BudgetsService],
        exports: [budgets_service_1.BudgetsService],
    })
], BudgetsModule);
//# sourceMappingURL=budgets.module.js.map