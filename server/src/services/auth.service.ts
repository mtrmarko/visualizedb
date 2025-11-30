import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { db } from '../config/database';
import type { User } from '../types/api.types';
import { AppError } from '../middleware/error-handler';

const SALT_ROUNDS = 10;

interface UserRow {
    id: string;
    email: string;
    password_hash: string;
    created_at: number;
    updated_at: number;
}

export const createUser = async (
    email: string,
    password: string
): Promise<User> => {
    // Check if user already exists
    const existing = db
        .prepare('SELECT id FROM users WHERE email = ?')
        .get(email) as { id: string } | undefined;

    if (existing) {
        throw new AppError(400, 'User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const id = nanoid();
    const now = Date.now();

    db.prepare(
        `
        INSERT INTO users (id, email, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    `
    ).run(id, email.toLowerCase(), passwordHash, now, now);

    return {
        id,
        email: email.toLowerCase(),
        createdAt: now,
        updatedAt: now,
    };
};

export const verifyUser = async (
    email: string,
    password: string
): Promise<User> => {
    const user = db
        .prepare('SELECT * FROM users WHERE email = ?')
        .get(email.toLowerCase()) as UserRow | undefined;

    if (!user) {
        throw new AppError(401, 'Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
        throw new AppError(401, 'Invalid email or password');
    }

    return {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
    };
};

export const getUserById = (userId: string): User | undefined => {
    const user = db
        .prepare(
            'SELECT id, email, created_at, updated_at FROM users WHERE id = ?'
        )
        .get(userId) as UserRow | undefined;

    if (!user) {
        return undefined;
    }

    return {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
    };
};

export const getUserByEmail = (email: string): User | undefined => {
    const user = db
        .prepare(
            'SELECT id, email, created_at, updated_at FROM users WHERE email = ?'
        )
        .get(email.toLowerCase()) as UserRow | undefined;

    if (!user) {
        return undefined;
    }

    return {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
    };
};
