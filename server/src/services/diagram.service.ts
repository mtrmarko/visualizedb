/* eslint-disable @typescript-eslint/no-explicit-any */
import { nanoid } from 'nanoid';
import { db } from '../config/database';
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

interface DiagramRow {
    id: string;
    user_id: string;
    name: string;
    database_type: string;
    database_edition: string | null;
    tables_json: string | null;
    relationships_json: string | null;
    dependencies_json: string | null;
    areas_json: string | null;
    custom_types_json: string | null;
    notes_json: string | null;
    created_at: number;
    updated_at: number;
}

interface ListOptions {
    includeTables?: boolean;
    includeRelationships?: boolean;
    includeDependencies?: boolean;
    includeAreas?: boolean;
    includeCustomTypes?: boolean;
    includeNotes?: boolean;
}

const rowToDiagram = (row: DiagramRow, options?: ListOptions): Diagram => {
    const diagram: Diagram = {
        id: row.id,
        name: row.name,
        databaseType: row.database_type,
        databaseEdition: row.database_edition || undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };

    if (options?.includeTables && row.tables_json) {
        diagram.tables = JSON.parse(row.tables_json);
    }
    if (options?.includeRelationships && row.relationships_json) {
        diagram.relationships = JSON.parse(row.relationships_json);
    }
    if (options?.includeDependencies && row.dependencies_json) {
        diagram.dependencies = JSON.parse(row.dependencies_json);
    }
    if (options?.includeAreas && row.areas_json) {
        diagram.areas = JSON.parse(row.areas_json);
    }
    if (options?.includeCustomTypes && row.custom_types_json) {
        diagram.customTypes = JSON.parse(row.custom_types_json);
    }
    if (options?.includeNotes && row.notes_json) {
        diagram.notes = JSON.parse(row.notes_json);
    }

    return diagram;
};

export const createDiagram = (
    userId: string,
    diagram: Partial<Diagram>
): Diagram => {
    const id = diagram.id || nanoid();
    const now = Date.now();

    db.prepare(
        `
        INSERT INTO diagrams (
            id, user_id, name, database_type, database_edition,
            tables_json, relationships_json, dependencies_json,
            areas_json, custom_types_json, notes_json,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
        id,
        userId,
        diagram.name || 'Untitled Diagram',
        diagram.databaseType || 'generic',
        diagram.databaseEdition || null,
        JSON.stringify(diagram.tables || []),
        JSON.stringify(diagram.relationships || []),
        JSON.stringify(diagram.dependencies || []),
        JSON.stringify(diagram.areas || []),
        JSON.stringify(diagram.customTypes || []),
        JSON.stringify(diagram.notes || []),
        now,
        now
    );

    return {
        id,
        name: diagram.name || 'Untitled Diagram',
        databaseType: diagram.databaseType || 'generic',
        databaseEdition: diagram.databaseEdition,
        tables: diagram.tables,
        relationships: diagram.relationships,
        dependencies: diagram.dependencies,
        areas: diagram.areas,
        customTypes: diagram.customTypes,
        notes: diagram.notes,
        createdAt: new Date(now),
        updatedAt: new Date(now),
    };
};

export const listDiagrams = (
    userId: string,
    options?: ListOptions
): Diagram[] => {
    const columns = [
        'id',
        'user_id',
        'name',
        'database_type',
        'database_edition',
        'created_at',
        'updated_at',
    ];

    if (options?.includeTables) columns.push('tables_json');
    if (options?.includeRelationships) columns.push('relationships_json');
    if (options?.includeDependencies) columns.push('dependencies_json');
    if (options?.includeAreas) columns.push('areas_json');
    if (options?.includeCustomTypes) columns.push('custom_types_json');
    if (options?.includeNotes) columns.push('notes_json');

    const rows = db
        .prepare(
            `
            SELECT ${columns.join(', ')}
            FROM diagrams
            WHERE user_id = ?
            ORDER BY updated_at DESC
        `
        )
        .all(userId) as DiagramRow[];

    return rows.map((row) => rowToDiagram(row, options));
};

export const getDiagram = (
    userId: string,
    diagramId: string,
    options?: ListOptions
): Diagram | undefined => {
    const columns = [
        'id',
        'user_id',
        'name',
        'database_type',
        'database_edition',
        'created_at',
        'updated_at',
    ];

    if (options?.includeTables) columns.push('tables_json');
    if (options?.includeRelationships) columns.push('relationships_json');
    if (options?.includeDependencies) columns.push('dependencies_json');
    if (options?.includeAreas) columns.push('areas_json');
    if (options?.includeCustomTypes) columns.push('custom_types_json');
    if (options?.includeNotes) columns.push('notes_json');

    const row = db
        .prepare(
            `
            SELECT ${columns.join(', ')}
            FROM diagrams
            WHERE id = ? AND user_id = ?
        `
        )
        .get(diagramId, userId) as DiagramRow | undefined;

    if (!row) {
        return undefined;
    }

    return rowToDiagram(row, options);
};

export const updateDiagram = (
    userId: string,
    diagramId: string,
    updates: Partial<Diagram>
): void => {
    console.log(
        'updateDiagram service - diagramId:',
        diagramId,
        'userId:',
        userId
    );
    console.log('updateDiagram service - update keys:', Object.keys(updates));

    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
        setClauses.push('name = ?');
        values.push(updates.name);
    }
    if (updates.databaseType !== undefined) {
        setClauses.push('database_type = ?');
        values.push(updates.databaseType);
    }
    if (updates.databaseEdition !== undefined) {
        setClauses.push('database_edition = ?');
        values.push(updates.databaseEdition);
    }
    if (updates.tables !== undefined) {
        setClauses.push('tables_json = ?');
        values.push(JSON.stringify(updates.tables));
        console.log(
            'updateDiagram service - updating tables, count:',
            updates.tables.length
        );
    }
    if (updates.relationships !== undefined) {
        setClauses.push('relationships_json = ?');
        values.push(JSON.stringify(updates.relationships));
    }
    if (updates.dependencies !== undefined) {
        setClauses.push('dependencies_json = ?');
        values.push(JSON.stringify(updates.dependencies));
    }
    if (updates.areas !== undefined) {
        setClauses.push('areas_json = ?');
        values.push(JSON.stringify(updates.areas));
    }
    if (updates.customTypes !== undefined) {
        setClauses.push('custom_types_json = ?');
        values.push(JSON.stringify(updates.customTypes));
    }
    if (updates.notes !== undefined) {
        setClauses.push('notes_json = ?');
        values.push(JSON.stringify(updates.notes));
    }

    if (setClauses.length === 0) {
        console.log('updateDiagram service - no changes to apply');
        return;
    }

    setClauses.push('updated_at = ?');
    values.push(Date.now());

    values.push(diagramId, userId);

    console.log(
        'updateDiagram service - SQL:',
        `UPDATE diagrams SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`
    );

    const result = db
        .prepare(
            `
        UPDATE diagrams
        SET ${setClauses.join(', ')}
        WHERE id = ? AND user_id = ?
    `
        )
        .run(...values);

    console.log('updateDiagram service - result.changes:', result.changes);

    if (result.changes === 0) {
        throw new AppError(404, 'Diagram not found');
    }
};

export const deleteDiagram = (userId: string, diagramId: string): void => {
    const result = db
        .prepare('DELETE FROM diagrams WHERE id = ? AND user_id = ?')
        .run(diagramId, userId);

    if (result.changes === 0) {
        throw new AppError(404, 'Diagram not found');
    }
};

// Config operations
export const getUserConfig = (userId: string): any => {
    const row = db
        .prepare(
            'SELECT default_diagram_id, config_json FROM user_config WHERE user_id = ?'
        )
        .get(userId) as
        | { default_diagram_id: string | null; config_json: string | null }
        | undefined;

    if (!row) {
        return null;
    }

    return {
        defaultDiagramId: row.default_diagram_id,
        ...(row.config_json ? JSON.parse(row.config_json) : {}),
    };
};

export const updateUserConfig = (userId: string, config: any): void => {
    const { defaultDiagramId, ...otherConfig } = config;

    db.prepare(
        `
        INSERT INTO user_config (user_id, default_diagram_id, config_json)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            default_diagram_id = excluded.default_diagram_id,
            config_json = excluded.config_json
    `
    ).run(userId, defaultDiagramId || null, JSON.stringify(otherConfig));
};

// Filter operations
export const getDiagramFilter = (userId: string, diagramId: string): any => {
    const row = db
        .prepare(
            'SELECT table_ids_json, schema_ids_json FROM diagram_filters WHERE diagram_id = ? AND user_id = ?'
        )
        .get(diagramId, userId) as
        | { table_ids_json: string | null; schema_ids_json: string | null }
        | undefined;

    if (!row) {
        return null;
    }

    // Return undefined for null columns instead of empty arrays
    // undefined = no restriction, [] = restrict to nothing (hide all)
    return {
        tableIds: row.table_ids_json
            ? JSON.parse(row.table_ids_json)
            : undefined,
        schemaIds: row.schema_ids_json
            ? JSON.parse(row.schema_ids_json)
            : undefined,
    };
};

export const updateDiagramFilter = (
    userId: string,
    diagramId: string,
    filter: any
): void => {
    db.prepare(
        `
        INSERT INTO diagram_filters (diagram_id, user_id, table_ids_json, schema_ids_json)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(diagram_id) DO UPDATE SET
            table_ids_json = excluded.table_ids_json,
            schema_ids_json = excluded.schema_ids_json
    `
    ).run(
        diagramId,
        userId,
        // Store null for undefined, not empty array
        // undefined/null = no restriction, [] = restrict to nothing
        filter.tableIds !== undefined ? JSON.stringify(filter.tableIds) : null,
        filter.schemaIds !== undefined ? JSON.stringify(filter.schemaIds) : null
    );
};
