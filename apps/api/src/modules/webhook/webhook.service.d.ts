import { NotificationsService } from "../notifications/notifications.service";
export declare class WebhookService {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    handleEvent(event: any): Promise<void>;
    private sendWelcomeMessage;
    private sendMonthlySummary;
}
