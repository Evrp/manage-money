import { Controller, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import * as crypto from 'crypto';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async handleWebhook(
    @Body() body: any,
    @Headers('x-line-signature') signature: string,
  ) {
    if (!this.verifySignature(JSON.stringify(body), signature)) {
      throw new BadRequestException('Invalid signature');
    }

    const events = body.events || [];
    for (const event of events) {
      await this.webhookService.handleEvent(event);
    }

    return { success: true };
  }

  private verifySignature(body: string, signature: string): boolean {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    if (!channelSecret || !signature) return false;

    const hash = crypto
      .createHmac('sha256', channelSecret)
      .update(body)
      .digest('base64');

    return hash === signature;
  }
}
