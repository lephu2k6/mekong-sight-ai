import { getRedisClient } from '../redis/client';
import { logger } from '../utils/logger';

export enum EventType {
    USER_CREATED = 'USER_CREATED',
    USER_UPDATED = 'USER_UPDATED',
    FARM_UPDATED = 'FARM_UPDATED',
    SENSOR_DATA_RECEIVED = 'SENSOR_DATA_RECEIVED',
    ALERT_TRIGGERED = 'ALERT_TRIGGERED',
    SEASON_RECOMMENDATION_READY = 'SEASON_RECOMMENDATION_READY'
}

export class EventBus {
    private publisher = getRedisClient();
    private subscriber = getRedisClient().duplicate();

    async publish(data: { type: EventType; data: any; source?: string }): Promise<void> {
        try {
            await this.publisher.publish(data.type, JSON.stringify(data.data));
            logger.info(`Event published: ${data.type}`, { payload: data.data, source: data.source });
        } catch (error) {
            logger.error(`Error publishing event ${data.type}:`, error);
            throw error;
        }
    }

    async subscribe(event: EventType, callback: (payload: any) => Promise<void>): Promise<void> {
        try {
            await this.subscriber.subscribe(event);
            this.subscriber.on('message', async (channel, message) => {
                if (channel === event) {
                    try {
                        const payload = JSON.parse(message);
                        await callback(payload);
                    } catch (err) {
                        logger.error(`Error processing message for ${event}:`, err);
                    }
                }
            });
            logger.info(`Subscribed to event: ${event}`);
        } catch (error) {
            logger.error(`Error subscribing to event ${event}:`, error);
            throw error;
        }
    }
}
