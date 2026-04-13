"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const express_1 = __importDefault(require("express"));
const server = (0, express_1.default)();
const createApp = async (expressInstance) => {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressInstance));
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.enableCors();
    await app.init();
    return app;
};
exports.createApp = createApp;
// For local development
if (process.env.NODE_ENV !== "production") {
    const bootstrap = async () => {
        const app = await (0, exports.createApp)(server);
        await app.listen(process.env.PORT || 3000);
        console.log(`Application is running on: http://localhost:${process.env.PORT || 3000}`);
    };
    bootstrap();
}
// Handler for Vercel
let appPromise;
exports.default = async (req, res) => {
    if (!appPromise) {
        appPromise = (0, exports.createApp)(server);
    }
    await appPromise;
    return server(req, res);
};
//# sourceMappingURL=main.js.map