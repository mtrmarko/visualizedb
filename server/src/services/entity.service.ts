/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '../config/database';
import { AppError } from '../middleware/error-handler';

export type EntityCollection =
    | 'tables'
    | 'relationships'
    | 'dependencies'
    | 'areas'
    | 'customTypes'
    | 'notes';

const collectionToColumn: Record<EntityCollection, string> = {
    tables: 'tablesJson',
    relationships: 'relationshipsJson',
    dependencies: 'dependenciesJson',
    areas: 'areasJson',
    customTypes: 'customTypesJson',
    notes: 'notesJson',
};

const parseEntities = (json: string | null | undefined): any[] => {
    if (!json) return [];
    try {
        return JSON.parse(json);
    } catch {
        return [];
    }
};

const ensureDiagramOwnership = async (
    diagramId: string,
    userId: string
): Promise<void> => {
    const exists = await prisma.diagram.findFirst({
        where: {
            id: diagramId,
            userId,
        },
        select: { id: true },
    });

    if (!exists) {
        throw new AppError(404, 'Diagram not found');
    }
};

const listDiagramEntities = async (
    userId: string,
    diagramId: string,
    collection: EntityCollection
): Promise<any[]> => {
    const column = collectionToColumn[collection];

    const row = await prisma.diagram.findFirst({
        where: {
            id: diagramId,
            userId,
        },
    });

    if (!row) {
        throw new AppError(404, 'Diagram not found');
    }

    const jsonValue = row[column as keyof typeof row];
    return parseEntities(typeof jsonValue === 'string' ? jsonValue : null);
};

const saveDiagramEntities = async (
    userId: string,
    diagramId: string,
    collection: EntityCollection,
    entities: any[]
): Promise<void> => {
    const column = collectionToColumn[collection];
    const now = Date.now();

    const data: any = {
        [column]: JSON.stringify(entities),
        updatedAt: now,
    };

    const result = await prisma.diagram.updateMany({
        where: {
            id: diagramId,
            userId,
        },
        data,
    });

    if (result.count === 0) {
        throw new AppError(404, 'Diagram not found');
    }
};

const findEntityContainer = async (
    userId: string,
    entityId: string,
    collection: EntityCollection
): Promise<{ diagramId: string; entities: any[]; index: number }> => {
    const column = collectionToColumn[collection];

    const rows = await prisma.diagram.findMany({
        where: { userId },
    });

    for (const row of rows) {
        const jsonValue = row[column as keyof typeof row];
        const entities = parseEntities(
            typeof jsonValue === 'string' ? jsonValue : null
        );
        const index = entities.findIndex(
            (entity: any) => entity?.id === entityId
        );
        if (index !== -1) {
            return { diagramId: row.id, entities, index };
        }
    }

    throw new AppError(404, 'Entity not found');
};

export const listEntities = async (
    userId: string,
    diagramId: string,
    collection: EntityCollection
): Promise<any[]> => {
    return listDiagramEntities(userId, diagramId, collection);
};

export const getEntity = async (
    userId: string,
    diagramId: string,
    collection: EntityCollection,
    entityId: string
): Promise<any> => {
    const entities = await listDiagramEntities(userId, diagramId, collection);
    const entity = entities.find((item) => item?.id === entityId);

    if (!entity) {
        throw new AppError(404, 'Entity not found');
    }

    return entity;
};

export const addEntity = async (
    userId: string,
    diagramId: string,
    collection: EntityCollection,
    entity: any
): Promise<any> => {
    await ensureDiagramOwnership(diagramId, userId);
    const entities = await listDiagramEntities(userId, diagramId, collection);
    entities.push(entity);
    await saveDiagramEntities(userId, diagramId, collection, entities);
    return entity;
};

export const replaceEntity = async (
    userId: string,
    diagramId: string,
    collection: EntityCollection,
    entityId: string,
    entity: any
): Promise<any> => {
    await ensureDiagramOwnership(diagramId, userId);
    const entities = await listDiagramEntities(userId, diagramId, collection);
    const index = entities.findIndex((item) => item?.id === entityId);

    if (index === -1) {
        throw new AppError(404, 'Entity not found');
    }

    entities[index] = entity;
    await saveDiagramEntities(userId, diagramId, collection, entities);
    return entity;
};

export const updateEntityById = async (
    userId: string,
    collection: EntityCollection,
    entityId: string,
    attributes: Record<string, any>
): Promise<any> => {
    const { diagramId, entities, index } = await findEntityContainer(
        userId,
        entityId,
        collection
    );
    const updatedEntity = { ...entities[index], ...attributes };
    entities[index] = updatedEntity;
    await saveDiagramEntities(userId, diagramId, collection, entities);
    return { diagramId, entity: updatedEntity };
};

export const deleteEntity = async (
    userId: string,
    diagramId: string,
    collection: EntityCollection,
    entityId: string
): Promise<void> => {
    await ensureDiagramOwnership(diagramId, userId);
    const entities = await listDiagramEntities(userId, diagramId, collection);
    const filtered = entities.filter((item) => item?.id !== entityId);

    if (filtered.length === entities.length) {
        throw new AppError(404, 'Entity not found');
    }

    await saveDiagramEntities(userId, diagramId, collection, filtered);
};

export const clearEntities = async (
    userId: string,
    diagramId: string,
    collection: EntityCollection
): Promise<void> => {
    await ensureDiagramOwnership(diagramId, userId);
    await saveDiagramEntities(userId, diagramId, collection, []);
};
