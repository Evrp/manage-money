import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  Req,
} from "@nestjs/common";
import { WebhookService } from "./webhook.service";
import * as crypto from "crypto";

@Controller("webhook")
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async handleWebhook(
    @Req() req: any,
    @Body() body: any,
    @Headers("x-line-signature") signature: string,
  ) {
    const events = body.events || [];
    const channelSecret = process.env.LINE_CHANNEL_SECRET;

    if (!channelSecret) {
      console.warn("LINE_CHANNEL_SECRET is not set");
      return { success: true };
    }

    // Use captured rawBody from main.ts
    const rawBody = req.rawBody;

    if (!rawBody) {
      console.warn(
        "rawBody is missing from request. Falling back to JSON.stringify",
      );
      const fallbackBody = JSON.stringify(body);
      if (!this.verifySignature(fallbackBody, signature, channelSecret)) {
        if (events.length === 0) return { success: true };
        console.error("Signature verification failed with fallback body");
        throw new BadRequestException("Invalid signature");
      }
    } else {
      if (!this.verifySignature(rawBody, signature, channelSecret)) {
        console.error("Signature verification failed even with rawBody");
        console.error("Body length:", rawBody.length);

        if (events.length === 0) return { success: true };
        throw new BadRequestException("Invalid signature");
      }
    }

    for (const event of events) {
      await this.webhookService.handleEvent(event);
    }

    return { success: true };
  }

  private verifySignature(
    body: string,
    signature: string,
    secret: string,
  ): boolean {
    if (!signature) return false;

    const hash = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("base64");

    return hash === signature;
  }
}
