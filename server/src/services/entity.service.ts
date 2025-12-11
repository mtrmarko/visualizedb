/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '../config/database';
import { AppError } from '../middleware/error-handler';

export type EntityCollection =
    | 'tables'
    | 'relationships'
    | 'dependencies'
    | 'areas'
    | 'customTypes'
    | 'notes';

const collectionToColumn: Record<EntityCollection, string> = {
    tables: 'tables_json',
    relationships: 'relationships_json',
    dependencies: 'dependencies_json',
    areas: 'areas_json',
    customTypes: 'custom_types_json',
    notes: 'notes_json',
};

const parseEntities = (json: string | null | undefined): any[] => {
    if (!json) return [];
    try {
        return JSON.parse(json);
    } catch {
        return [];
    }
};

const ensureDiagramOwnership = (diagramId: string, userId: string): void => {
    const exists = db
        .prepare('SELECT id FROM diagrams WHERE id = ? AND user_id = ?')
        .get(diagramId, userId) as { id: string } | undefined;

    if (!exists) {
        throw new AppError(404, 'Diagram not found');
    }
};

const listDiagramEntities = (
    userId: string,
    diagramId: string,
    collection: EntityCollection
): any[] => {
    const column = collectionToColumn[collection];
    const row = db
        .prepare(`SELECT ${column} FROM diagrams WHERE id = ? AND user_id = ?`)
        .get(diagramId, userId) as Record<string, string> | undefined;

    if (!row) {
        throw new AppError(404, 'Diagram not found');
    }

    return parseEntities(row[column]);
};

const saveDiagramEntities = (
    userId: string,
    diagramId: string,
    collection: EntityCollection,
    entities: any[]
): void => {
    const column = collectionToColumn[collection];
    const now = Date.now();
    const result = db
        .prepare(
            `
            UPDATE diagrams
            SET ${column} = ?, updated_at = ?
            WHERE id = ? AND user_id = ?
        `
        )
        .run(JSON.stringify(entities), now, diagramId, userId);

    if (result.changes === 0) {
        throw new AppError(404, 'Diagram not found');
    }
};

const findEntityContainer = (
    userId: string,
    entityId: string,
    collection: EntityCollection
): { diagramId: string; entities: any[]; index: number } => {
    const column = collectionToColumn[collection];
    const rows = db
        .prepare(`SELECT id, ${column} FROM diagrams WHERE user_id = ?`)
        .all(userId) as Array<Record<string, string>>;

    for (const row of rows) {
        const entities = parseEntities(row[column]);
        const index = entities.findIndex(
            (entity: any) => entity?.id === entityId
        );
        if (index !== -1) {
            return { diagramId: row.id, entities, index };
        }
    }

    throw new AppError(404, 'Entity not found');
};

export const listEntities = (
    userId: string,
    diagramId: string,
    collection: EntityCollection
): any[] => {
    return listDiagramEntities(userId, diagramId, collection);
};

export const getEntity = (
    userId: string,
    diagramId: string,
    collection: EntityCollection,
    entityId: string
): any => {
    const entities = listDiagramEntities(userId, diagramId, collection);
    const entity = entities.find((item) => item?.id === entityId);

    if (!entity) {
        throw new AppError(404, 'Entity not found');
    }

    return entity;
};

export const addEntity = (
    userId: string,
    diagramId: string,
    collection: EntityCollection,
    entity: any
): any => {
    ensureDiagramOwnership(diagramId, userId);
    const entities = listDiagramEntities(userId, diagramId, collection);
    entities.push(entity);
    saveDiagramEntities(userId, diagramId, collection, entities);
    return entity;
};

export const replaceEntity = (
    userId: string,
    diagramId: string,
    collection: EntityCollection,
    entityId: string,
    entity: any
): any => {
    ensureDiagramOwnership(diagramId, userId);
    const entities = listDiagramEntities(userId, diagramId, collection);
    const index = entities.findIndex((item) => item?.id === entityId);

    if (index === -1) {
        throw new AppError(404, 'Entity not found');
    }

    entities[index] = entity;
    saveDiagramEntities(userId, diagramId, collection, entities);
    return entity;
};

export const updateEntityById = (
    userId: string,
    collection: EntityCollection,
    entityId: string,
    attributes: Record<string, any>
): any => {
    const { diagramId, entities, index } = findEntityContainer(
        userId,
        entityId,
        collection
    );
    const updatedEntity = { ...entities[index], ...attributes };
    entities[index] = updatedEntity;
    saveDiagramEntities(userId, diagramId, collection, entities);
    return { diagramId, entity: updatedEntity };
};

export const deleteEntity = (
    userId: string,
    diagramId: string,
    collection: EntityCollection,
    entityId: string
): void => {
    ensureDiagramOwnership(diagramId, userId);
    const entities = listDiagramEntities(userId, diagramId, collection);
    const filtered = entities.filter((item) => item?.id !== entityId);

    if (filtered.length === entities.length) {
        throw new AppError(404, 'Entity not found');
    }

    saveDiagramEntities(userId, diagramId, collection, filtered);
};

export const clearEntities = (
    userId: string,
    diagramId: string,
    collection: EntityCollection
): void => {
    ensureDiagramOwnership(diagramId, userId);
    saveDiagramEntities(userId, diagramId, collection, []);
};
