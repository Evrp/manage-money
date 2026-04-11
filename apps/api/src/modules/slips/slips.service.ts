import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import axios from "axios";
import { SlipUpload } from "../../schemas/slip-upload.schema";
import { TransactionsService } from "../transactions/transactions.service";
import { CreateTransactionDto } from "../transactions/dto/create-transaction.dto";
import { SlipUploadStatus } from "@moneyflow/shared";

@Injectable()
export class SlipsService {
  constructor(
    @InjectModel(SlipUpload.name) private slipUploadModel: Model<SlipUpload>,
    private readonly transactionsService: TransactionsService,
  ) {}

  async processUpload(userId: string, file: Express.Multer.File) {
    const bucketName = process.env.GCS_BUCKET_NAME;
    const fileName = `${userId}/${Date.now()}_${file.originalname}`;

    // In a real environment, you would use:
    // const bucket = this.storage.bucket(bucketName);
    // const blob = bucket.file(fileName);
    // await blob.save(file.buffer);

    const imageUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

    // Create record
    const slipUpload = await this.slipUploadModel.create({
      userId,
      imageUrl,
      status: SlipUploadStatus.PROCESSING,
    });

    try {
      // 2. OCR with Google Gemini API
      const extractedData = await this.extractWithGemini(
        file.buffer.toString("base64"),
        file.mimetype,
      );

      slipUpload.extractedData = extractedData;
      slipUpload.status = SlipUploadStatus.SUCCESS;
      slipUpload.processedAt = new Date();
      await slipUpload.save();

      return {
        id: slipUpload._id,
        imageUrl,
        extractedData,
      };
    } catch (error: any) {
      slipUpload.status = SlipUploadStatus.FAILED;
      slipUpload.errorMessage = error.message;
      await slipUpload.save();
      console.error("OCR Processing Error:", error);
      throw new BadRequestException("Failed to process slip OCR with Gemini");
    }
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
    } catch (error) {
      console.error("Gemini API Error:", (error as any).response?.data || (error as any).message);
      throw new Error("Gemini API integration failed");
    }
  }
}
