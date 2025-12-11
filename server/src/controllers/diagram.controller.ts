import type { Request, Response, NextFunction } from 'express';
import {
    createDiagram,
    listDiagrams,
    getDiagram,
    updateDiagram,
    deleteDiagram,
    getUserConfig,
    updateUserConfig,
    getDiagramFilter,
    updateDiagramFilter,
    deleteDiagramFilter,
} from '../services/diagram.service';

export const create = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { diagram } = req.body;

        const newDiagram = createDiagram(userId, diagram);

        res.status(201).json({ diagram: newDiagram });
    } catch (error) {
        next(error);
    }
};

export const list = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const include = (req.query.include as string)?.split(',') || [];

        const options = {
            includeTables: include.includes('tables'),
            includeRelationships: include.includes('relationships'),
            includeDependencies: include.includes('dependencies'),
            includeAreas: include.includes('areas'),
            includeCustomTypes: include.includes('customTypes'),
            includeNotes: include.includes('notes'),
        };

        const diagrams = listDiagrams(userId, options);

        res.json({ diagrams });
    } catch (error) {
        next(error);
    }
};

export const get = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;
        const include = (req.query.include as string)?.split(',') || [];

        const options = {
            includeTables: include.includes('tables'),
            includeRelationships: include.includes('relationships'),
            includeDependencies: include.includes('dependencies'),
            includeAreas: include.includes('areas'),
            includeCustomTypes: include.includes('customTypes'),
            includeNotes: include.includes('notes'),
        };

        const diagram = getDiagram(userId, id, options);

        if (!diagram) {
            return res.status(404).json({ error: 'Diagram not found' });
        }

        res.json({ diagram });
    } catch (error) {
        next(error);
    }
};

export const update = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;
        const { diagram } = req.body;

        console.log('update controller - diagramId:', id, 'userId:', userId);
        console.log(
            'update controller - diagram keys:',
            Object.keys(diagram || {})
        );

        updateDiagram(userId, id, diagram);

        // Fetch updated diagram
        const fullOptions = {
            includeTables: true,
            includeRelationships: true,
            includeDependencies: true,
            includeAreas: true,
            includeCustomTypes: true,
            includeNotes: true,
        };
        const updatedDiagram = getDiagram(userId, id, fullOptions);

        console.log(
            'update controller - updated diagram found:',
            !!updatedDiagram
        );

        res.json({ diagram: updatedDiagram });
    } catch (error) {
        console.error('update controller - error:', error);
        next(error);
    }
};

export const remove = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        deleteDiagram(userId, id);

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

export const getConfig = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const config = getUserConfig(userId);

        res.json({ config: config || {} });
    } catch (error) {
        next(error);
    }
};

export const putConfig = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { config } = req.body;

        updateUserConfig(userId, config);

        res.json({ config });
    } catch (error) {
        next(error);
    }
};

export const getFilter = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        const filter = getDiagramFilter(userId, id);

        // Return null if no filter exists, so frontend can apply default logic
        res.json({ filter: filter || null });
    } catch (error) {
        next(error);
    }
};

export const putFilter = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;
        const { filter } = req.body;

        updateDiagramFilter(userId, id, filter);

        res.json({ filter });
    } catch (error) {
        next(error);
    }
};

export const deleteFilter = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        deleteDiagramFilter(userId, id);

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};
