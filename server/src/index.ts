import app from './app';
import { config } from './config/env';
import { initializeDatabase } from './config/database';

// Initialize database and start server
initializeDatabase()
    .then(() => {
        // Start server
        const server = app.listen(config.port, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║                    ChartDB Server                          ║
╠════════════════════════════════════════════════════════════╣
║  Environment: ${config.nodeEnv.padEnd(42)} ║
║  Port:        ${config.port.toString().padEnd(42)} ║
║  API URL:     http://localhost:${config.port}/api${' '.repeat(20)} ║
╚════════════════════════════════════════════════════════════╝
        `);
        });

        return server;
    })
    .catch((error) => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    });

// Graceful shutdown
const shutdown = () => {
    console.log('\nShutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('Forcing shutdown');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
