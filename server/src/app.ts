import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config, isProduction } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import authRoutes from './routes/auth.routes';
import diagramRoutes from './routes/diagram.routes';
import versionRoutes from './routes/version.routes';

const app = express();

// Security middleware
app.use(
    helmet({
        contentSecurityPolicy: isProduction ? undefined : false, // Disable in dev for Vite
    })
);

// CORS configuration
app.use(
    cors({
        origin: config.cors.origin,
        credentials: true, // Allow cookies
    })
);

// Body parsing middleware
app.use(express.json({ limit: '50mb' })); // Increased limit for large diagrams
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/diagrams', diagramRoutes);
app.use('/api/diagrams', versionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve static files from React build in production
if (isProduction) {
    const clientBuildPath = path.join(__dirname, '../../dist');
    app.use(express.static(clientBuildPath));

    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
} else {
    // In development, return 404 for non-API routes
    app.use(notFoundHandler);
}

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
