import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { config } from './env';

// Create Prisma adapter with libsql config
const adapter = new PrismaLibSql({
    url: `file:${config.database.path}`,
});

// Initialize Prisma Client with adapter
export const prisma = new PrismaClient({
    adapter,
    log:
        config.nodeEnv === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
});

// Initialize database (no-op now, Prisma handles schema)
export const initializeDatabase = () => {
    console.log('Database initialized successfully');
};

// Close database connection gracefully
export const closeDatabase = async () => {
    await prisma.$disconnect();
    console.log('Database connection closed');
};

// Handle process termination
process.on('SIGINT', async () => {
    await closeDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closeDatabase();
    process.exit(0);
});
