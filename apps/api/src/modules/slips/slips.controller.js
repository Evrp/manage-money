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
exports.SlipsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const slips_service_1 = require("./slips.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let SlipsController = class SlipsController {
    constructor(slipsService) {
        this.slipsService = slipsService;
    }
    async upload(req, file) {
        if (!file)
            throw new common_1.BadRequestException("No file uploaded");
        return this.slipsService.processUpload(req.user.userId, file);
    }
    async uploadOnly(req, file) {
        if (!file)
            throw new common_1.BadRequestException("No file uploaded");
        return this.slipsService.uploadOnly(req.user.userId, file);
    }
    async confirm(req, body) {
        return this.slipsService.confirm(req.user.userId, body.slipId, body.transactionData);
    }
};
exports.SlipsController = SlipsController;
__decorate([
    (0, common_1.Post)("upload"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SlipsController.prototype, "upload", null);
__decorate([
    (0, common_1.Post)("attachment"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SlipsController.prototype, "uploadOnly", null);
__decorate([
    (0, common_1.Post)("confirm"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SlipsController.prototype, "confirm", null);
exports.SlipsController = SlipsController = __decorate([
    (0, common_1.Controller)("slips"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [slips_service_1.SlipsService])
], SlipsController);
//# sourceMappingURL=slips.controller.js.map