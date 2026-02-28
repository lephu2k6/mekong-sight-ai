import express from 'express';
import Queue from 'bull';
import { logger, config } from '@mekong/shared';

const app = express();
app.use(express.json());

// Initialize Bull Queues
const smsQueue = new Queue('sms-notifications', {
    redis: { port: config.redis.port, host: config.redis.host, password: config.redis.password }
});

const emailQueue = new Queue('email-notifications', {
    redis: { port: config.redis.port, host: config.redis.host, password: config.redis.password }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'notification-service' });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    logger.info(`Notification Service running on port ${PORT}`);
});
