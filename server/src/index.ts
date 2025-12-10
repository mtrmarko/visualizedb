import app from './app';
import { config } from './config/env';
import { initializeDatabase } from './config/database';
import type { Server } from 'http';

let server: Server | null = null;

initializeDatabase()
    .then(() => {
        server = app.listen(config.port, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║                    VisualizeDB Server                          ║
╠════════════════════════════════════════════════════════════╣
║  Environment: ${String(config.nodeEnv).padEnd(42)} ║
║  Port:        ${String(config.port).padEnd(42)} ║
║  API URL:     http://localhost:${config.port}/api${' '.repeat(20)} ║
╚════════════════════════════════════════════════════════════╝
        `);
        });
    })
    .catch((error) => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    });

// Graceful shutdown
const shutdown = (): void => {
    console.log('\nShutting down gracefully...');
    if (server) {
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('Forcing shutdown');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
