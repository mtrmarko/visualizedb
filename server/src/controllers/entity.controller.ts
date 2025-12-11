import type { Request, Response, NextFunction } from 'express';
import {
    addEntity,
    clearEntities,
    deleteEntity,
    getEntity,
    listEntities,
    replaceEntity,
    updateEntityById,
    type EntityCollection,
} from '../services/entity.service';

const pluralKeys: Record<EntityCollection, string> = {
    tables: 'tables',
    relationships: 'relationships',
    dependencies: 'dependencies',
    areas: 'areas',
    customTypes: 'customTypes',
    notes: 'notes',
};

const singularKeys: Record<EntityCollection, string> = {
    tables: 'table',
    relationships: 'relationship',
    dependencies: 'dependency',
    areas: 'area',
    customTypes: 'customType',
    notes: 'note',
};

type EntityParam =
    | 'tableId'
    | 'relationshipId'
    | 'dependencyId'
    | 'areaId'
    | 'customTypeId'
    | 'noteId';

const listHandler =
    (collection: EntityCollection) =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const diagramId = req.params.id;
            const items = listEntities(userId, diagramId, collection);
            res.json({ [pluralKeys[collection]]: items });
        } catch (error) {
            next(error);
        }
    };

const addHandler =
    (collection: EntityCollection, payloadKey: string) =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const diagramId = req.params.id;
            const entity = req.body[payloadKey];
            const created = addEntity(userId, diagramId, collection, entity);
            res.status(201).json({ [singularKeys[collection]]: created });
        } catch (error) {
            next(error);
        }
    };

const getByDiagramHandler =
    (collection: EntityCollection, entityParam: EntityParam) =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const diagramId = req.params.id;
            const entityId = req.params[entityParam];
            const entity = getEntity(userId, diagramId, collection, entityId);
            res.json({ [singularKeys[collection]]: entity });
        } catch (error) {
            next(error);
        }
    };

const replaceHandler =
    (
        collection: EntityCollection,
        entityParam: EntityParam,
        payloadKey: string
    ) =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const diagramId = req.params.id;
            const entityId = req.params[entityParam];
            const entity = req.body[payloadKey];
            const updated = replaceEntity(
                userId,
                diagramId,
                collection,
                entityId,
                entity
            );
            res.json({ [singularKeys[collection]]: updated });
        } catch (error) {
            next(error);
        }
    };

const updateByIdHandler =
    (collection: EntityCollection, entityParam: EntityParam) =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const entityId = req.params[entityParam];
            const { attributes } = req.body;
            const { entity } = updateEntityById(
                userId,
                collection,
                entityId,
                attributes || {}
            );
            res.json({ [singularKeys[collection]]: entity });
        } catch (error) {
            next(error);
        }
    };

const deleteHandler =
    (collection: EntityCollection, entityParam: EntityParam) =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const diagramId = req.params.id;
            const entityId = req.params[entityParam];
            deleteEntity(userId, diagramId, collection, entityId);
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    };

const clearHandler =
    (collection: EntityCollection) =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const diagramId = req.params.id;
            clearEntities(userId, diagramId, collection);
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    };

export const tableControllers = {
    list: listHandler('tables'),
    add: addHandler('tables', 'table'),
    get: getByDiagramHandler('tables', 'tableId'),
    replace: replaceHandler('tables', 'tableId', 'table'),
    updateById: updateByIdHandler('tables', 'tableId'),
    remove: deleteHandler('tables', 'tableId'),
    clear: clearHandler('tables'),
};

export const relationshipControllers = {
    list: listHandler('relationships'),
    add: addHandler('relationships', 'relationship'),
    get: getByDiagramHandler('relationships', 'relationshipId'),
    replace: replaceHandler('relationships', 'relationshipId', 'relationship'),
    updateById: updateByIdHandler('relationships', 'relationshipId'),
    remove: deleteHandler('relationships', 'relationshipId'),
    clear: clearHandler('relationships'),
};

export const dependencyControllers = {
    list: listHandler('dependencies'),
    add: addHandler('dependencies', 'dependency'),
    get: getByDiagramHandler('dependencies', 'dependencyId'),
    replace: replaceHandler('dependencies', 'dependencyId', 'dependency'),
    updateById: updateByIdHandler('dependencies', 'dependencyId'),
    remove: deleteHandler('dependencies', 'dependencyId'),
    clear: clearHandler('dependencies'),
};

export const areaControllers = {
    list: listHandler('areas'),
    add: addHandler('areas', 'area'),
    get: getByDiagramHandler('areas', 'areaId'),
    replace: replaceHandler('areas', 'areaId', 'area'),
    updateById: updateByIdHandler('areas', 'areaId'),
    remove: deleteHandler('areas', 'areaId'),
    clear: clearHandler('areas'),
};

export const customTypeControllers = {
    list: listHandler('customTypes'),
    add: addHandler('customTypes', 'customType'),
    get: getByDiagramHandler('customTypes', 'customTypeId'),
    replace: replaceHandler('customTypes', 'customTypeId', 'customType'),
    updateById: updateByIdHandler('customTypes', 'customTypeId'),
    remove: deleteHandler('customTypes', 'customTypeId'),
    clear: clearHandler('customTypes'),
};

export const noteControllers = {
    list: listHandler('notes'),
    add: addHandler('notes', 'note'),
    get: getByDiagramHandler('notes', 'noteId'),
    replace: replaceHandler('notes', 'noteId', 'note'),
    updateById: updateByIdHandler('notes', 'noteId'),
    remove: deleteHandler('notes', 'noteId'),
    clear: clearHandler('notes'),
};
