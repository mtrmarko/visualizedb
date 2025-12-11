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

export const create = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.userId;
        const { diagram } = req.body;

        const newDiagram = await createDiagram(userId, diagram);

        res.status(201).json({ diagram: newDiagram });
    } catch (error) {
        next(error);
    }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
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

        const diagrams = await listDiagrams(userId, options);

        res.json({ diagrams });
    } catch (error) {
        next(error);
    }
};

export const get = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
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

        const diagram = await getDiagram(userId, id, options);

        if (!diagram) {
            res.status(404).json({ error: 'Diagram not found' });
            return;
        }

        res.json({ diagram });
    } catch (error) {
        next(error);
    }
};

export const update = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;
        const { diagram } = req.body;

        console.log('update controller - diagramId:', id, 'userId:', userId);
        console.log(
            'update controller - diagram keys:',
            Object.keys(diagram || {})
        );

        await updateDiagram(userId, id, diagram);

        // Fetch updated diagram
        const fullOptions = {
            includeTables: true,
            includeRelationships: true,
            includeDependencies: true,
            includeAreas: true,
            includeCustomTypes: true,
            includeNotes: true,
        };
        const updatedDiagram = await getDiagram(userId, id, fullOptions);

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

export const remove = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        await deleteDiagram(userId, id);

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

export const getConfig = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.userId;
        const config = await getUserConfig(userId);

        res.json({ config: config || {} });
    } catch (error) {
        next(error);
    }
};

export const putConfig = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.userId;
        const { config } = req.body;

        await updateUserConfig(userId, config);

        res.json({ config });
    } catch (error) {
        next(error);
    }
};

export const getFilter = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        const filter = await getDiagramFilter(userId, id);

        // Return null if no filter exists, so frontend can apply default logic
        res.json({ filter: filter || null });
    } catch (error) {
        next(error);
    }
};

export const putFilter = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;
        const { filter } = req.body;

        await updateDiagramFilter(userId, id, filter);

        res.json({ filter });
    } catch (error) {
        next(error);
    }
};

export const deleteFilter = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        await deleteDiagramFilter(userId, id);

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};
