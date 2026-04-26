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
      console.warn("LINE_CHANNEL_SECRET is not set in environment variables");
      return { success: true };
    }

    // Use the raw body captured in main.ts
    const rawBody = req.rawBody || JSON.stringify(body);

    if (!this.verifySignature(rawBody, signature, channelSecret)) {
      console.error("LINE Signature verification failed");
      // If it's a test/verify request (no events), return 200 to keep the webhook active
      if (events.length === 0) return { success: true };

      throw new BadRequestException("Invalid signature");
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
