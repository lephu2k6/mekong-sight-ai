import dotenv from 'dotenv';
import path from 'path';

// Try to load .env from project root (3 levels up from this file's compiled location in dist/)
// Adjust based on where this file ends up. 
// Source: packages/shared/src/config/index.ts
// Compiled: packages/shared/dist/config/index.js
// Root is at: ../../../
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
// Also try default for good measure
dotenv.config();

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_ANON_KEY,
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'super-secret-key',
        expiresIn: '7d'
    }
};
