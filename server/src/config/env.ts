import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),

    jwt: {
        secret:
            process.env.JWT_SECRET ||
            'development-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshSecret:
            process.env.REFRESH_TOKEN_SECRET ||
            'development-refresh-secret-key',
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    },

    database: {
        path:
            process.env.DATABASE_PATH ||
            path.join(__dirname, '../../database/chartdb.db'),
    },

    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    },
} as const;

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
