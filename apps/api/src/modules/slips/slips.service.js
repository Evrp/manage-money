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
exports.SlipsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const axios_1 = __importDefault(require("axios"));
const slip_upload_schema_1 = require("../../schemas/slip-upload.schema");
const transactions_service_1 = require("../transactions/transactions.service");
const shared_1 = require("@moneyflow/shared");
const sharp_1 = __importDefault(require("sharp"));
const firebase_service_1 = require("../firebase/firebase.service");
let SlipsService = class SlipsService {
    constructor(slipUploadModel, transactionsService, firebaseService) {
        this.slipUploadModel = slipUploadModel;
        this.transactionsService = transactionsService;
        this.firebaseService = firebaseService;
    }
    async processUpload(userId, file) {
        const session = await this.slipUploadModel.db.startSession();
        session.startTransaction();
        try {
            // 1. Upload to storage (Done outside DB transaction usually, but we keep its metadata inside)
            const { imageUrl, processedBuffer } = await this.uploadToStorage(userId, file);
            // 2. Create record with session
            const [slipUpload] = await this.slipUploadModel.create([
                {
                    userId,
                    imageUrl,
                    status: shared_1.SlipUploadStatus.PROCESSING,
                },
            ], { session });
            // 3. OCR with Google Gemini API
            const extractedData = await this.extractWithGemini(processedBuffer.toString("base64"), "image/webp");
            // 4. Update and Commit
            slipUpload.extractedData = extractedData;
            slipUpload.status = shared_1.SlipUploadStatus.SUCCESS;
            slipUpload.processedAt = new Date();
            await slipUpload.save({ session });
            await session.commitTransaction();
            return {
                id: slipUpload._id,
                imageUrl,
                extractedData,
            };
        }
        catch (error) {
            await session.abortTransaction();
            console.error("OCR Processing Error:", error);
            throw new common_1.BadRequestException(error.message || "Failed to process slip OCR with Gemini");
        }
        finally {
            session.endSession();
        }
    }
    async uploadOnly(userId, file) {
        const { imageUrl } = await this.uploadToStorage(userId, file);
        return { imageUrl };
    }
    async uploadToStorage(userId, file) {
        let processedBuffer = file.buffer;
        let mimeType = file.mimetype;
        let fileName = `slips/${userId}/${Date.now()}_${file.originalname}`;
        if (file.mimetype.startsWith("image/")) {
            try {
                processedBuffer = await (0, sharp_1.default)(file.buffer)
                    .resize({ width: 1200, withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toBuffer();
                mimeType = "image/webp";
                fileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";
            }
            catch (error) {
                console.error("Image processing error:", error);
            }
        }
        const bucket = this.firebaseService.getBucket();
        const fileRef = bucket.file(fileName);
        await fileRef.save(processedBuffer, {
            contentType: mimeType,
            metadata: { userId },
        });
        const imageUrl = await this.firebaseService.getSignedUrl(fileName);
        return { fileName, imageUrl, processedBuffer, mimeType };
    }
    async confirm(userId, slipId, confirmData) {
        const slipUpload = await this.slipUploadModel.findOne({
            _id: slipId,
            userId,
        });
        if (!slipUpload)
            throw new common_1.BadRequestException("Slip not found");
        const transaction = await this.transactionsService.create(userId, confirmData);
        slipUpload.status = shared_1.SlipUploadStatus.SUCCESS;
        slipUpload.transactionId = transaction._id.toString();
        await slipUpload.save();
        return transaction;
    }
    async extractWithGemini(base64Image, mimeType) {
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey)
            throw new Error("GOOGLE_GEMINI_API_KEY not configured");
        const systemPrompt = "You are a Thai bank transaction slip OCR expert. Extract data accurately.";
        const userPrompt = `Extract the following from this Thai bank slip image and return ONLY valid JSON:
    {
      "transactionType": "transfer|payment|deposit|withdrawal",
      "amount": number,
      "currency": "THB",
      "fromBank": "bank name or null",
      "toBank": "bank name or null",
      "toAccountNumber": "last 4 digits or null",
      "toName": "recipient name in Thai or English or null",
      "referenceNo": "reference number or null",
      "transactionDate": "YYYY-MM-DD or null",
      "transactionTime": "HH:mm or null",
      "suggestedCategory": "one of: ค่าเช่า|อาหาร|ขนส่ง|ช้อปปิ้ง|สุขภาพ|บันเทิง|การศึกษา|สาธารณูปโภค|โอนเงิน|รายได้|อื่นๆ",
      "confidence": 0.0-1.0
    }
    If you cannot read the image clearly, return confidence below 0.5.`;
        try {
            // Using Gemini 1.5 Flash via REST API
            const response = await axios_1.default.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
                contents: [
                    {
                        parts: [
                            { text: `${systemPrompt}\n\n${userPrompt}` },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64Image,
                                },
                            },
                        ],
                    },
                ],
                generationConfig: {
                    response_mime_type: "application/json",
                },
            }, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const textResponse = response.data.candidates[0].content.parts[0].text;
            return JSON.parse(textResponse);
        }
        catch (error) {
            const errorDetail = error.response?.data?.error?.message || error.message;
            console.error("Gemini OCR Error details:", errorDetail);
            throw new Error(`Gemini API Error: ${errorDetail}`);
        }
    }
};
exports.SlipsService = SlipsService;
exports.SlipsService = SlipsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(slip_upload_schema_1.SlipUpload.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        transactions_service_1.TransactionsService,
        firebase_service_1.FirebaseService])
], SlipsService);
//# sourceMappingURL=slips.service.js.map