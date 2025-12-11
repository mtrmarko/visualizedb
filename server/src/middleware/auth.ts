import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/auth';
import { prisma } from '../config/database';

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const payload = verifyAccessToken(token);

        // Attach user info to request
        req.user = {
            userId: payload.userId,
            email: payload.email,
        };

        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const verifyDiagramOwnership = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const diagramId = req.params.id || req.params.diagramId;
        const userId = req.user?.userId;

        console.log(
            'verifyDiagramOwnership - diagramId:',
            diagramId,
            'userId:',
            userId,
            'method:',
            req.method
        );

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const diagram = await prisma.diagram.findUnique({
            where: { id: diagramId },
            select: { userId: true },
        });

        console.log('verifyDiagramOwnership - diagram found:', !!diagram);

        if (!diagram) {
            res.status(404).json({ error: 'Diagram not found' });
            return;
        }

        if (diagram.userId !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        next();
    } catch (error) {
        console.error('verifyDiagramOwnership - error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
