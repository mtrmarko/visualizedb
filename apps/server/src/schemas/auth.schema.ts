import { z } from 'zod';

export const authPayloadSchema = z.object({
    userId: z.string(),
    email: z.string().email(),
});

export const userSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    createdAt: z.number(),
    updatedAt: z.number(),
});

export const authResponseSchema = z.object({
    user: userSchema,
    token: z.string(),
});

export const signupRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const loginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const refreshResponseSchema = z.object({
    token: z.string(),
});
