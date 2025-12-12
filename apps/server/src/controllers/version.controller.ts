import type { Request, Response, NextFunction } from 'express';
import {
    createVersion,
    listVersions,
    getVersion,
    restoreVersion,
    deleteVersion,
} from '../services/version.service';

export const create = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { diagramId } = req.params;
        const { versionName, description } = req.body;

        const version = createVersion(
            userId,
            diagramId,
            versionName,
            description
        );

        res.status(201).json({ version });
    } catch (error) {
        next(error);
    }
};

export const list = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { diagramId } = req.params;

        const versions = listVersions(userId, diagramId);

        res.json({ versions });
    } catch (error) {
        next(error);
    }
};

export const get = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { versionId } = req.params;

        const version = getVersion(userId, versionId);

        res.json({ version });
    } catch (error) {
        next(error);
    }
};

export const restore = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { diagramId, versionId } = req.params;

        const diagram = restoreVersion(userId, diagramId, versionId);

        res.json({ diagram });
    } catch (error) {
        next(error);
    }
};

export const remove = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { versionId } = req.params;

        deleteVersion(userId, versionId);

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};
