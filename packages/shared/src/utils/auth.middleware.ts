import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from './logger';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const jwtSecret = process.env.JWT_SECRET;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!jwtSecret) {
        logger.error('JWT_SECRET is not configured');
        return res.status(500).json({ success: false, message: 'Server auth is not configured' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, jwtSecret);
        (req as any).user = decoded;
        next();
    } catch (error) {
        logger.error('JWT Verification failed');
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};
