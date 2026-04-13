"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlipsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const slips_service_1 = require("./slips.service");
const slips_controller_1 = require("./slips.controller");
const slip_upload_schema_1 = require("../../schemas/slip-upload.schema");
const transactions_module_1 = require("../transactions/transactions.module");
let SlipsModule = class SlipsModule {
};
exports.SlipsModule = SlipsModule;
exports.SlipsModule = SlipsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: slip_upload_schema_1.SlipUpload.name, schema: slip_upload_schema_1.SlipUploadSchema },
            ]),
            transactions_module_1.TransactionsModule,
        ],
        controllers: [slips_controller_1.SlipsController],
        providers: [slips_service_1.SlipsService],
        exports: [slips_service_1.SlipsService],
    })
], SlipsModule);
//# sourceMappingURL=slips.module.js.map