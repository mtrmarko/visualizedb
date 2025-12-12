/* eslint-disable @typescript-eslint/no-explicit-any */
import { nanoid } from 'nanoid';
import { prisma } from '../config/database';
import { AppError } from '../middleware/error-handler';

interface Diagram {
    id: string;
    name: string;
    databaseType: string;
    databaseEdition?: string;
    tables?: any[];
    relationships?: any[];
    dependencies?: any[];
    areas?: any[];
    customTypes?: any[];
    notes?: any[];
    createdAt: Date;
    updatedAt: Date;
}

interface ListOptions {
    includeTables?: boolean;
    includeRelationships?: boolean;
    includeDependencies?: boolean;
    includeAreas?: boolean;
    includeCustomTypes?: boolean;
    includeNotes?: boolean;
}

export const createDiagram = async (
    userId: string,
    diagram: Partial<Diagram>
): Promise<Diagram> => {
    const id = diagram.id || nanoid();
    const now = Date.now();

    const created = await prisma.diagram.create({
        data: {
            id,
            userId,
            name: diagram.name || 'Untitled Diagram',
            databaseType: diagram.databaseType || 'generic',
            databaseEdition: diagram.databaseEdition || null,
            tablesJson: JSON.stringify(diagram.tables || []),
            relationshipsJson: JSON.stringify(diagram.relationships || []),
            dependenciesJson: JSON.stringify(diagram.dependencies || []),
            areasJson: JSON.stringify(diagram.areas || []),
            customTypesJson: JSON.stringify(diagram.customTypes || []),
            notesJson: JSON.stringify(diagram.notes || []),
            createdAt: now,
            updatedAt: now,
        },
    });

    return {
        id: created.id,
        name: created.name,
        databaseType: created.databaseType,
        databaseEdition: created.databaseEdition || undefined,
        tables: diagram.tables,
        relationships: diagram.relationships,
        dependencies: diagram.dependencies,
        areas: diagram.areas,
        customTypes: diagram.customTypes,
        notes: diagram.notes,
        createdAt: new Date(created.createdAt),
        updatedAt: new Date(created.updatedAt),
    };
};

export const listDiagrams = async (
    userId: string,
    options?: ListOptions
): Promise<Diagram[]> => {
    const diagrams = await prisma.diagram.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
    });

    return diagrams.map((row) => {
        const diagram: Diagram = {
            id: row.id,
            name: row.name,
            databaseType: row.databaseType,
            databaseEdition: row.databaseEdition || undefined,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        };

        if (options?.includeTables && row.tablesJson) {
            diagram.tables = JSON.parse(row.tablesJson);
        }
        if (options?.includeRelationships && row.relationshipsJson) {
            diagram.relationships = JSON.parse(row.relationshipsJson);
        }
        if (options?.includeDependencies && row.dependenciesJson) {
            diagram.dependencies = JSON.parse(row.dependenciesJson);
        }
        if (options?.includeAreas && row.areasJson) {
            diagram.areas = JSON.parse(row.areasJson);
        }
        if (options?.includeCustomTypes && row.customTypesJson) {
            diagram.customTypes = JSON.parse(row.customTypesJson);
        }
        if (options?.includeNotes && row.notesJson) {
            diagram.notes = JSON.parse(row.notesJson);
        }

        return diagram;
    });
};

export const getDiagram = async (
    userId: string,
    diagramId: string,
    options?: ListOptions
): Promise<Diagram | undefined> => {
    const row = await prisma.diagram.findFirst({
        where: {
            id: diagramId,
            userId,
        },
    });

    if (!row) {
        return undefined;
    }

    const diagram: Diagram = {
        id: row.id,
        name: row.name,
        databaseType: row.databaseType,
        databaseEdition: row.databaseEdition || undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };

    if (options?.includeTables && row.tablesJson) {
        diagram.tables = JSON.parse(row.tablesJson);
    }
    if (options?.includeRelationships && row.relationshipsJson) {
        diagram.relationships = JSON.parse(row.relationshipsJson);
    }
    if (options?.includeDependencies && row.dependenciesJson) {
        diagram.dependencies = JSON.parse(row.dependenciesJson);
    }
    if (options?.includeAreas && row.areasJson) {
        diagram.areas = JSON.parse(row.areasJson);
    }
    if (options?.includeCustomTypes && row.customTypesJson) {
        diagram.customTypes = JSON.parse(row.customTypesJson);
    }
    if (options?.includeNotes && row.notesJson) {
        diagram.notes = JSON.parse(row.notesJson);
    }

    return diagram;
};

export const updateDiagram = async (
    userId: string,
    diagramId: string,
    updates: Partial<Diagram>
): Promise<void> => {
    console.log(
        'updateDiagram service - diagramId:',
        diagramId,
        'userId:',
        userId
    );
    console.log('updateDiagram service - update keys:', Object.keys(updates));

    const data: any = {};

    if (updates.name !== undefined) {
        data.name = updates.name;
    }
    if (updates.databaseType !== undefined) {
        data.databaseType = updates.databaseType;
    }
    if (updates.databaseEdition !== undefined) {
        data.databaseEdition = updates.databaseEdition;
    }
    if (updates.tables !== undefined) {
        data.tablesJson = JSON.stringify(updates.tables);
        console.log(
            'updateDiagram service - updating tables, count:',
            updates.tables.length
        );
    }
    if (updates.relationships !== undefined) {
        data.relationshipsJson = JSON.stringify(updates.relationships);
    }
    if (updates.dependencies !== undefined) {
        data.dependenciesJson = JSON.stringify(updates.dependencies);
    }
    if (updates.areas !== undefined) {
        data.areasJson = JSON.stringify(updates.areas);
    }
    if (updates.customTypes !== undefined) {
        data.customTypesJson = JSON.stringify(updates.customTypes);
    }
    if (updates.notes !== undefined) {
        data.notesJson = JSON.stringify(updates.notes);
    }

    if (Object.keys(data).length === 0) {
        console.log('updateDiagram service - no changes to apply');
        return;
    }

    data.updatedAt = Date.now();

    console.log(
        'updateDiagram service - updating with data:',
        Object.keys(data)
    );

    try {
        const result = await prisma.diagram.updateMany({
            where: {
                id: diagramId,
                userId,
            },
            data,
        });

        console.log('updateDiagram service - result.count:', result.count);

        if (result.count === 0) {
            throw new AppError(404, 'Diagram not found');
        }
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw error;
    }
};

export const deleteDiagram = async (
    userId: string,
    diagramId: string
): Promise<void> => {
    const result = await prisma.diagram.deleteMany({
        where: {
            id: diagramId,
            userId,
        },
    });

    if (result.count === 0) {
        throw new AppError(404, 'Diagram not found');
    }
};

// Config operations
export const getUserConfig = async (userId: string): Promise<any> => {
    const config = await prisma.userConfig.findUnique({
        where: { userId },
        select: {
            defaultDiagramId: true,
            configJson: true,
        },
    });

    if (!config) {
        return null;
    }

    return {
        defaultDiagramId: config.defaultDiagramId,
        ...(config.configJson ? JSON.parse(config.configJson) : {}),
    };
};

export const updateUserConfig = async (
    userId: string,
    config: any
): Promise<void> => {
    const { defaultDiagramId, ...otherConfig } = config;

    await prisma.userConfig.upsert({
        where: { userId },
        create: {
            userId,
            defaultDiagramId: defaultDiagramId || null,
            configJson: JSON.stringify(otherConfig),
        },
        update: {
            defaultDiagramId: defaultDiagramId || null,
            configJson: JSON.stringify(otherConfig),
        },
    });
};

// Filter operations
export const getDiagramFilter = async (
    userId: string,
    diagramId: string
): Promise<any> => {
    const filter = await prisma.diagramFilter.findFirst({
        where: {
            diagramId,
            userId,
        },
        select: {
            tableIdsJson: true,
            schemaIdsJson: true,
        },
    });

    if (!filter) {
        return null;
    }

    // Return undefined for null columns instead of empty arrays
    // undefined = no restriction, [] = restrict to nothing (hide all)
    return {
        tableIds: filter.tableIdsJson
            ? JSON.parse(filter.tableIdsJson)
            : undefined,
        schemaIds: filter.schemaIdsJson
            ? JSON.parse(filter.schemaIdsJson)
            : undefined,
    };
};

export const updateDiagramFilter = async (
    userId: string,
    diagramId: string,
    filter: any
): Promise<void> => {
    await prisma.diagramFilter.upsert({
        where: { diagramId },
        create: {
            diagramId,
            userId,
            // Store null for undefined, not empty array
            // undefined/null = no restriction, [] = restrict to nothing
            tableIdsJson:
                filter.tableIds !== undefined
                    ? JSON.stringify(filter.tableIds)
                    : null,
            schemaIdsJson:
                filter.schemaIds !== undefined
                    ? JSON.stringify(filter.schemaIds)
                    : null,
        },
        update: {
            tableIdsJson:
                filter.tableIds !== undefined
                    ? JSON.stringify(filter.tableIds)
                    : null,
            schemaIdsJson:
                filter.schemaIds !== undefined
                    ? JSON.stringify(filter.schemaIds)
                    : null,
        },
    });
};

export const deleteDiagramFilter = async (
    userId: string,
    diagramId: string
): Promise<void> => {
    await prisma.diagramFilter.deleteMany({
        where: {
            diagramId,
            userId,
        },
    });
};
