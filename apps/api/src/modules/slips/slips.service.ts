import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { SlipUpload } from "../../schemas/slip-upload.schema";
import { TransactionsService } from "../transactions/transactions.service";
import { CreateTransactionDto } from "../transactions/dto/create-transaction.dto";
import { SlipUploadStatus } from "@moneyflow/shared";
import sharp from "sharp";
import { FirebaseService } from "../firebase/firebase.service";
import { GeminiService } from "../gemini/gemini.service";

@Injectable()
export class SlipsService {
  constructor(
    @InjectModel(SlipUpload.name) private slipUploadModel: Model<SlipUpload>,
    private readonly transactionsService: TransactionsService,
    private readonly firebaseService: FirebaseService,
    private readonly geminiService: GeminiService,
  ) {}

  async processUpload(userId: string, file: Express.Multer.File) {
    // Store the file first. Once it is safely stored, an OCR failure must not
    // make the receipt unusable: the user can still enter the transaction.
    const { fileName, imageUrl, processedBuffer, mimeType } =
      await this.uploadToStorage(userId, file);

    try {
      // OCR is optional enhancement; the stored file remains usable on failure.
      const extractedData = await this.extractWithGemini(
        processedBuffer.toString("base64"),
        mimeType,
      );

      const slipUpload = await this.slipUploadModel.create({
        userId,
        imageUrl: fileName,
        extractedData,
        status: SlipUploadStatus.SUCCESS,
        processedAt: new Date(),
      });

      return {
        id: slipUpload._id,
        imageUrl, // Still return signed URL for immediate display
        extractedData,
      };
    } catch (error: any) {
      console.error("OCR Processing Error:", error);

      const slipUpload = await this.slipUploadModel.create({
        userId,
        imageUrl: fileName,
        status: SlipUploadStatus.FAILED,
        errorMessage: error.message || "Failed to process slip OCR with Gemini",
        processedAt: new Date(),
      });

      return {
        id: slipUpload._id,
        imageUrl,
        extractedData: null,
        requiresManualEntry: true,
      };
    }
  }

  async uploadOnly(userId: string, file: Express.Multer.File) {
    const { imageUrl } = await this.uploadToStorage(userId, file);
    return { imageUrl };
  }

  async findPending(userId: string) {
    const uploads = await this.slipUploadModel
      .find({ userId, transactionId: { $exists: false } })
      .sort({ createdAt: -1 })
      .lean();

    return Promise.all(
      uploads.map(async (upload) => {
        let signedImageUrl: string | null = null;
        try {
          signedImageUrl = await this.firebaseService.getSignedUrl(
            upload.imageUrl,
          );
        } catch (error) {
          console.error("Failed to refresh pending slip URL:", error);
        }

        return {
          id: upload._id.toString(),
          imageUrl: signedImageUrl,
          fileName: upload.imageUrl.split("/").pop() || "slip",
          status: upload.status,
          extractedData: upload.extractedData || null,
          errorMessage: upload.errorMessage || null,
          processedAt: upload.processedAt || null,
        };
      }),
    );
  }

  async removePending(userId: string, slipId: string) {
    const upload = await this.slipUploadModel.findOne({
      _id: slipId,
      userId,
      transactionId: { $exists: false },
    });
    if (!upload) throw new BadRequestException("Slip not found");

    await this.firebaseService.deleteFileFromUrl(upload.imageUrl);
    await upload.deleteOne();
    return { deleted: true };
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
    } else if (file.mimetype === "application/pdf") {
      mimeType = "application/pdf";
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

  async processBatchUpload(userId: string, files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files uploaded");
    }

    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const res = await this.processUpload(userId, file);
          return {
            filename: file.originalname,
            status: "success",
            ...res,
          };
        } catch (error: any) {
          return {
            filename: file.originalname,
            status: "error",
            error: error.message || "Failed to process slip",
          };
        }
      }),
    );

    return results;
  }

  async confirmBatch(
    userId: string,
    items: Array<{ slipId: string; transactionData: CreateTransactionDto }>,
  ) {
    if (!items || items.length === 0) {
      throw new BadRequestException("No items provided for confirmation");
    }

    const results = [];
    for (const item of items) {
      try {
        const transaction = await this.confirm(
          userId,
          item.slipId,
          item.transactionData,
        );
        results.push({ slipId: item.slipId, status: "success", transaction });
      } catch (error: any) {
        results.push({
          slipId: item.slipId,
          status: "error",
          error: error.message || "Failed to confirm slip",
        });
      }
    }

    return results;
  }

  private async extractWithGemini(base64Image: string, mimeType: string) {
    const systemPrompt =
      "You are a Thai bank and credit-card receipt OCR expert. Extract data accurately. Never invent unreadable values; use null and lower confidence.";
    const userPrompt = `Extract the following from this Thai bank slip image and return ONLY valid JSON:
    {
      "documentType": "bank_transfer|credit_card_statement|cash_advance|unknown",
      "transactionType": "transfer|payment|deposit|withdrawal|cash_advance",
      "amount": number,
      "currency": "THB",
      "fromBank": "bank name or null",
      "toBank": "bank name or null",
      "toAccountNumber": "last 4 digits or null",
      "toName": "recipient name in Thai or English or null",
      "referenceNo": "reference number or null",
      "transactionDate": "YYYY-MM-DD or null",
      "transactionTime": "HH:mm or null",
      "creditCardLast4": "last 4 digits of card or null",
      "cashAdvanceAmount": "cash received/withdrawn amount or null",
      "feeAmount": "one-time fee amount or null",
      "receiptInterestRate": "annual interest rate printed on receipt or null",
      "minimumPaymentRate": "minimum payment percentage or null",
      "minimumPaymentAmount": "minimum payment amount or null",
      "statementDueDate": "YYYY-MM-DD or null",
      "suggestedCategory": "one of: ค่าเช่า|อาหาร|ขนส่ง|ช้อปปิ้ง|สุขภาพ|บันเทิง|การศึกษา|สาธารณูปโภค|โอนเงิน|รายได้|อื่นๆ",
      "confidence": 0.0-1.0
    }
    Convert Thai Buddhist years (พ.ศ.) to Gregorian years. For a credit-card receipt, prefer the printed due date and rate over defaults. If you cannot read the image clearly, return confidence below 0.5.`;

    try {
      const result = await this.geminiService.generateContent(
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
        },
        { responseMimeType: "application/json" },
      );

      const textResponse = result.candidates[0].content.parts[0].text;
      return JSON.parse(textResponse);
    } catch (error: any) {
      const errorDetail = error.response?.data?.error?.message || error.message;
      console.error("Gemini OCR Error details:", errorDetail);
      throw new Error(`Gemini API Error: ${errorDetail}`);
    }
  }
}
