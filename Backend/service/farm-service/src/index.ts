import express from 'express';
import cors from 'cors';
import { logger } from '@mekong/shared';
import farmRoutes from './routes/farm.routes';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/farms', farmRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'farm-service' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    logger.info(`Farm Service running on port ${PORT}`);
});
