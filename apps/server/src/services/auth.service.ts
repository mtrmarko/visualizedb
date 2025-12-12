import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { prisma } from '../config/database';
import type { User } from '@visualizedb/shared';
import { AppError } from '../middleware/error-handler';

const SALT_ROUNDS = 10;

export const createUser = async (
    email: string,
    password: string
): Promise<User> => {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });

    if (existing) {
        throw new AppError(400, 'User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const id = nanoid();
    const now = Date.now();

    const user = await prisma.user.create({
        data: {
            id,
            email: email.toLowerCase(),
            passwordHash,
            createdAt: now,
            updatedAt: now,
        },
    });

    return {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
};

export const verifyUser = async (
    email: string,
    password: string
): Promise<User> => {
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });

    if (!user) {
        throw new AppError(401, 'Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
        throw new AppError(401, 'Invalid email or password');
    }

    return {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
};

export const getUserById = async (
    userId: string
): Promise<User | undefined> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        return undefined;
    }

    return {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
};

export const getUserByEmail = async (
    email: string
): Promise<User | undefined> => {
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
            id: true,
            email: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        return undefined;
    }

    return {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
};
