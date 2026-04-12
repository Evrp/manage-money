import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SlipsService } from "./slips.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateTransactionDto } from "../transactions/dto/create-transaction.dto";

@Controller("slips")
@UseGuards(JwtAuthGuard)
export class SlipsController {
  constructor(private readonly slipsService: SlipsService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async upload(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.slipsService.processUpload(req.user.userId, file);
  }

  @Post("attachment")
  @UseInterceptors(FileInterceptor("file"))
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
}
