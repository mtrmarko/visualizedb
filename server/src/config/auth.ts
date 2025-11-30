import jwt from 'jsonwebtoken';
import { config } from './env';
import type { AuthPayload } from '../types/api.types';

export const generateAccessToken = (payload: AuthPayload): string => {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
};

export const generateRefreshToken = (payload: AuthPayload): string => {
    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
    });
};

export const verifyAccessToken = (token: string): AuthPayload => {
    try {
        return jwt.verify(token, config.jwt.secret) as AuthPayload;
    } catch {
        throw new Error('Invalid or expired token');
    }
};

export const verifyRefreshToken = (token: string): AuthPayload => {
    try {
        return jwt.verify(token, config.jwt.refreshSecret) as AuthPayload;
    } catch {
        throw new Error('Invalid or expired refresh token');
    }
};
