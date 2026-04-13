"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetsController = void 0;
const common_1 = require("@nestjs/common");
const budgets_service_1 = require("./budgets.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let BudgetsController = class BudgetsController {
    constructor(budgetsService) {
        this.budgetsService = budgetsService;
    }
    findByMonth(req, month, year) {
        return this.budgetsService.findByMonth(req.user.userId, Number(month), Number(year));
    }
    updateLimit(req, categoryId, month, year, limitAmount) {
        return this.budgetsService.updateLimit(req.user.userId, categoryId, Number(month), Number(year), limitAmount);
    }
};
exports.BudgetsController = BudgetsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("month")),
    __param(2, (0, common_1.Query)("year")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], BudgetsController.prototype, "findByMonth", null);
__decorate([
    (0, common_1.Put)("limit"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)("categoryId")),
    __param(2, (0, common_1.Body)("month")),
    __param(3, (0, common_1.Body)("year")),
    __param(4, (0, common_1.Body)("limitAmount")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number, Number]),
    __metadata("design:returntype", void 0)
], BudgetsController.prototype, "updateLimit", null);
exports.BudgetsController = BudgetsController = __decorate([
    (0, common_1.Controller)("budgets"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [budgets_service_1.BudgetsService])
], BudgetsController);
//# sourceMappingURL=budgets.controller.js.map