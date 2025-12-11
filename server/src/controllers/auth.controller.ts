import type { Request, Response, NextFunction } from 'express';
import { createUser, verifyUser, getUserById } from '../services/auth.service';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from '../config/auth';
import type { AuthResponse } from '../shared/api-types';

const REFRESH_TOKEN_COOKIE = 'refreshToken';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export const signup = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, password } = req.body;

        const user = await createUser(email, password);

        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
        });
        const refreshToken = generateRefreshToken({
            userId: user.id,
            email: user.email,
        });

        // Set refresh token as httpOnly cookie
        res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: COOKIE_MAX_AGE,
        });

        const response: AuthResponse = {
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            token: accessToken,
        };

        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
};

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, password } = req.body;

        const user = await verifyUser(email, password);

        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
        });
        const refreshToken = generateRefreshToken({
            userId: user.id,
            email: user.email,
        });

        // Set refresh token as httpOnly cookie
        res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: COOKIE_MAX_AGE,
        });

        const response: AuthResponse = {
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            token: accessToken,
        };

        res.json(response);
    } catch (error) {
        next(error);
    }
};

export const logout = (_req: Request, res: Response) => {
    res.clearCookie(REFRESH_TOKEN_COOKIE);
    res.json({ success: true });
};

export const refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

        if (!refreshToken) {
            res.status(401).json({ error: 'No refresh token provided' });
            return;
        }

        const payload = verifyRefreshToken(refreshToken);

        // Verify user still exists
        const user = await getUserById(payload.userId);
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }

        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
        });

        res.json({ token: accessToken });
    } catch (error) {
        res.clearCookie(REFRESH_TOKEN_COOKIE);
        next(error);
    }
};

export const me = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await getUserById(userId);

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ user });
    } catch (error) {
        next(error);
    }
};
