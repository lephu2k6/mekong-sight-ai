import { logger, EventBus, EventType } from '@mekong/shared';

export class NotificationService {
    private eventBus = new EventBus();

    constructor() {
        this.init();
    }

    private init() {
        // Đăng ký nghe các event cần gửi thông báo
        this.eventBus.subscribe(EventType.ALERT_TRIGGERED, async (payload) => {
            await this.sendAlertNotification(payload);
        });

        this.eventBus.subscribe(EventType.SEASON_RECOMMENDATION_READY, async (payload) => {
            await this.sendRecommendationNotification(payload);
        });

        logger.info('Notification Service Subscriptions initialized');
    }

    private async sendAlertNotification(payload: any) {
        const { farm_id, title, message, severity } = payload;

        // Giả lập gửi SMS/Firebase/Email
        logger.info(`[NOTIFICATION] Sending ${severity} alert to Farm ${farm_id}: ${title}`);
        console.log(`>>> SMS/PUSH: ${message}`);

        // TODO: Thực hiện gọi Twilio hoặc Firebase Admin SDK ở đây
    }

    private async sendRecommendationNotification(payload: any) {
        const { farm_id, action, message } = payload;
        logger.info(`[NOTIFICATION] Recommendation for Farm ${farm_id}: ${action}`);
        console.log(`>>> MESSAGE: ${message}`);
    }
}
