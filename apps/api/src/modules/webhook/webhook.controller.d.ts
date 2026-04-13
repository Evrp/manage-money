import { WebhookService } from "./webhook.service";
export declare class WebhookController {
    private readonly webhookService;
    constructor(webhookService: WebhookService);
    handleWebhook(body: any, signature: string): Promise<{
        success: boolean;
    }>;
    private verifySignature;
}
