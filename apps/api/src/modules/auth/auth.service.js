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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const axios_1 = __importDefault(require("axios"));
const user_schema_1 = require("../../schemas/user.schema");
const category_schema_1 = require("../../schemas/category.schema");
const default_categories_1 = require("../../seeds/default-categories");
let AuthService = class AuthService {
    constructor(jwtService, userModel, categoryModel) {
        this.jwtService = jwtService;
        this.userModel = userModel;
        this.categoryModel = categoryModel;
    }
    async validateLineToken(idToken) {
        try {
            const channelId = process.env.LINE_CHANNEL_ID;
            if (!channelId) {
                console.error("LINE_CHANNEL_ID is not defined in environment variables");
                throw new common_1.UnauthorizedException("Server configuration error: missing LINE_CHANNEL_ID");
            }
            const params = new URLSearchParams();
            params.append("id_token", idToken);
            params.append("client_id", channelId);
            const response = await axios_1.default.post("https://api.line.me/oauth2/v2.1/verify", params, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
            const { sub, name, picture, email } = response.data;
            if (!sub) {
                throw new common_1.UnauthorizedException("Invalid LINE token");
            }
            // Atomic find and update or create
            const user = await this.userModel.findOneAndUpdate({ lineUserId: sub }, {
                $set: {
                    displayName: name,
                    pictureUrl: picture,
                    email: email,
                },
                $setOnInsert: {
                    financialScore: 50,
                },
            }, { upsert: true, new: true, setDefaultsOnInsert: true });
            // Check if it was a new user by looking at categories
            const categoryCount = await this.categoryModel.countDocuments({
                userId: user._id,
            });
            if (categoryCount === 0) {
                // Initialize default categories for new user
                const categories = default_categories_1.DEFAULT_CATEGORIES.map((cat) => ({
                    ...cat,
                    userId: user._id,
                }));
                await this.categoryModel.insertMany(categories);
            }
            const payload = { sub: user._id, lineUserId: user.lineUserId };
            return {
                accessToken: this.jwtService.sign(payload),
                user,
            };
        }
        catch (error) {
            console.error("LINE verification error:", error.response?.data || error.message);
            throw new common_1.UnauthorizedException("Failed to verify LINE token");
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(category_schema_1.Category.name)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        mongoose_2.Model,
        mongoose_2.Model])
], AuthService);
//# sourceMappingURL=auth.service.js.map