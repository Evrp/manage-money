import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { SlipsService } from "./slips.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateTransactionDto } from "../transactions/dto/create-transaction.dto";

const multerOptions = {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(
          "รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP) หรือไฟล์ PDF เท่านั้น",
        ),
        false,
      );
    }
  },
};

@Controller("slips")
@UseGuards(JwtAuthGuard)
export class SlipsController {
  constructor(private readonly slipsService: SlipsService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file", multerOptions))
  async upload(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.slipsService.processUpload(req.user.userId, file);
  }

  @Post("batch-upload")
  @UseInterceptors(FilesInterceptor("files", 10, multerOptions))
  async batchUpload(
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files uploaded");
    }
    return this.slipsService.processBatchUpload(req.user.userId, files);
  }

  @Post("attachment")
  @UseInterceptors(FileInterceptor("file", multerOptions))
  async uploadOnly(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.slipsService.uploadOnly(req.user.userId, file);
  }

  @Post("confirm")
  async confirm(
    @Request() req,
    @Body() body: { slipId: string; transactionData: CreateTransactionDto },
  ) {
    return this.slipsService.confirm(
      req.user.userId,
      body.slipId,
      body.transactionData,
    );
  }

  @Post("batch-confirm")
  async confirmBatch(
    @Request() req,
    @Body()
    body: {
      items: Array<{ slipId: string; transactionData: CreateTransactionDto }>;
    },
  ) {
    return this.slipsService.confirmBatch(req.user.userId, body.items);
  }
}
