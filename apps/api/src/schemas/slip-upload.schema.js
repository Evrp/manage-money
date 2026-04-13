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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlipUploadSchema = exports.SlipUpload = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const shared_1 = require("@moneyflow/shared");
let SlipUpload = class SlipUpload extends mongoose_2.Document {
};
exports.SlipUpload = SlipUpload;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: "User", required: true }),
    __metadata("design:type", String)
], SlipUpload.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SlipUpload.prototype, "imageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: shared_1.SlipUploadStatus,
        default: shared_1.SlipUploadStatus.PENDING,
    }),
    __metadata("design:type", String)
], SlipUpload.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], SlipUpload.prototype, "extractedData", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: "Transaction" }),
    __metadata("design:type", String)
], SlipUpload.prototype, "transactionId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], SlipUpload.prototype, "errorMessage", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], SlipUpload.prototype, "processedAt", void 0);
exports.SlipUpload = SlipUpload = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], SlipUpload);
exports.SlipUploadSchema = mongoose_1.SchemaFactory.createForClass(SlipUpload);
//# sourceMappingURL=slip-upload.schema.js.map