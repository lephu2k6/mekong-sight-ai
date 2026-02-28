export declare enum EventType {
    USER_CREATED = "USER_CREATED",
    USER_UPDATED = "USER_UPDATED",
    FARM_UPDATED = "FARM_UPDATED",
    SENSOR_DATA_RECEIVED = "SENSOR_DATA_RECEIVED",
    ALERT_TRIGGERED = "ALERT_TRIGGERED",
    SEASON_RECOMMENDATION_READY = "SEASON_RECOMMENDATION_READY"
}
export declare class EventBus {
    private publisher;
    private subscriber;
    publish(data: {
        type: EventType;
        data: any;
        source?: string;
    }): Promise<void>;
    subscribe(event: EventType, callback: (payload: any) => Promise<void>): Promise<void>;
}
