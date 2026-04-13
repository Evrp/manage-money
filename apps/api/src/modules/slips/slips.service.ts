import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import axios from "axios";
import { SlipUpload } from "../../schemas/slip-upload.schema";
import { TransactionsService } from "../transactions/transactions.service";
import { CreateTransactionDto } from "../transactions/dto/create-transaction.dto";
import { SlipUploadStatus } from "@moneyflow/shared";
import sharp from "sharp";
import { FirebaseService } from "../firebase/firebase.service";

@Injectable()
export class SlipsService {
  constructor(
    @InjectModel(SlipUpload.name) private slipUploadModel: Model<SlipUpload>,
    private readonly transactionsService: TransactionsService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async processUpload(userId: string, file: Express.Multer.File) {
    const session = await this.slipUploadModel.db.startSession();
    session.startTransaction();

    try {
      // 1. Upload to storage (Done outside DB transaction usually, but we keep its metadata inside)
      const { imageUrl, processedBuffer } = await this.uploadToStorage(
        userId,
        file,
      );

      // 2. Create record with session
      const [slipUpload] = await this.slipUploadModel.create(
        [
          {
            userId,
            imageUrl,
            status: SlipUploadStatus.PROCESSING,
          },
        ],
        { session },
      );

      // 3. OCR with Google Gemini API
      const extractedData = await this.extractWithGemini(
        processedBuffer.toString("base64"),
        "image/webp",
      );

      // 4. Update and Commit
      slipUpload.extractedData = extractedData;
      slipUpload.status = SlipUploadStatus.SUCCESS;
      slipUpload.processedAt = new Date();
      await slipUpload.save({ session });

      await session.commitTransaction();

      return {
        id: slipUpload._id,
        imageUrl,
        extractedData,
      };
    } catch (error: any) {
      await session.abortTransaction();
      console.error("OCR Processing Error:", error);
      throw new BadRequestException(
        error.message || "Failed to process slip OCR with Gemini",
      );
    } finally {
      session.endSession();
    }
  }

  async uploadOnly(userId: string, file: Express.Multer.File) {
    const { imageUrl } = await this.uploadToStorage(userId, file);
    return { imageUrl };
  }

  private async uploadToStorage(userId: string, file: Express.Multer.File) {
    let processedBuffer = file.buffer;
    let mimeType = file.mimetype;
    let fileName = `slips/${userId}/${Date.now()}_${file.originalname}`;

    if (file.mimetype.startsWith("image/")) {
      try {
        processedBuffer = await sharp(file.buffer)
          .resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        mimeType = "image/webp";
        fileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";
      } catch (error) {
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

  async confirm(
    userId: string,
    slipId: string,
    confirmData: CreateTransactionDto,
  ) {
    const slipUpload = await this.slipUploadModel.findOne({
      _id: slipId,
      userId,
    });
    if (!slipUpload) throw new BadRequestException("Slip not found");

    const transaction = await this.transactionsService.create(
      userId,
      confirmData,
    );

    slipUpload.status = SlipUploadStatus.SUCCESS;
    slipUpload.transactionId = (transaction._id as any).toString();
    await slipUpload.save();

    return transaction;
  }

  private async extractWithGemini(base64Image: string, mimeType: string) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY not configured");

    const systemPrompt =
      "You are a Thai bank transaction slip OCR expert. Extract data accurately.";
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
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
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
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const textResponse = response.data.candidates[0].content.parts[0].text;
      return JSON.parse(textResponse);
    } catch (error: any) {
      const errorDetail = error.response?.data?.error?.message || error.message;
      console.error("Gemini OCR Error details:", errorDetail);
      throw new Error(`Gemini API Error: ${errorDetail}`);
    }
  }
}
