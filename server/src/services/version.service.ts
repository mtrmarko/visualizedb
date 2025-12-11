/* eslint-disable @typescript-eslint/no-explicit-any */
import { nanoid } from 'nanoid';
import { db } from '../config/database';
import { AppError } from '../middleware/error-handler';
import { getDiagram, updateDiagram } from './diagram.service';
import type { DiagramVersion } from '../shared/api-types';

interface VersionRow {
    id: string;
    diagram_id: string;
    user_id: string;
    version_name: string;
    description: string | null;
    snapshot_json: string;
    created_at: number;
}

export const createVersion = (
    userId: string,
    diagramId: string,
    versionName: string,
    description?: string
): DiagramVersion => {
    // Fetch current diagram state with all nested data
    const diagram = getDiagram(userId, diagramId, {
        includeTables: true,
        includeRelationships: true,
        includeDependencies: true,
        includeAreas: true,
        includeCustomTypes: true,
        includeNotes: true,
    });

    if (!diagram) {
        throw new AppError(404, 'Diagram not found');
    }

    // Create version snapshot
    const versionId = nanoid();
    const now = Date.now();
    const snapshotJson = JSON.stringify(diagram);

    db.prepare(
        `
        INSERT INTO diagram_versions (
            id, diagram_id, user_id, version_name, description, snapshot_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
        versionId,
        diagramId,
        userId,
        versionName,
        description || null,
        snapshotJson,
        now
    );

    return {
        id: versionId,
        diagramId,
        userId,
        versionName,
        description,
        createdAt: now,
    };
};

export const listVersions = (
    userId: string,
    diagramId: string
): DiagramVersion[] => {
    const rows = db
        .prepare(
            `
            SELECT id, diagram_id, user_id, version_name, description, created_at
            FROM diagram_versions
            WHERE diagram_id = ? AND user_id = ?
            ORDER BY created_at DESC
        `
        )
        .all(diagramId, userId) as Omit<VersionRow, 'snapshot_json'>[];

    return rows.map((row) => ({
        id: row.id,
        diagramId: row.diagram_id,
        userId: row.user_id,
        versionName: row.version_name,
        description: row.description || undefined,
        createdAt: row.created_at,
    }));
};

export const getVersion = (userId: string, versionId: string): any => {
    const row = db
        .prepare(
            `
            SELECT *
            FROM diagram_versions
            WHERE id = ? AND user_id = ?
        `
        )
        .get(versionId, userId) as VersionRow | undefined;

    if (!row) {
        throw new AppError(404, 'Version not found');
    }

    return {
        id: row.id,
        diagramId: row.diagram_id,
        userId: row.user_id,
        versionName: row.version_name,
        description: row.description || undefined,
        snapshot: JSON.parse(row.snapshot_json),
        createdAt: row.created_at,
    };
};

export const restoreVersion = (
    userId: string,
    diagramId: string,
    versionId: string
): any => {
    // Fetch version snapshot
    const version = getVersion(userId, versionId);

    if (version.diagramId !== diagramId) {
        throw new AppError(400, 'Version does not belong to this diagram');
    }

    // Create auto-backup before restore
    const currentDiagram = getDiagram(userId, diagramId, {
        includeTables: true,
        includeRelationships: true,
        includeDependencies: true,
        includeAreas: true,
        includeCustomTypes: true,
        includeNotes: true,
    });

    if (currentDiagram) {
        const backupName = `Auto-backup before restore to "${version.versionName}"`;
        createVersion(
            userId,
            diagramId,
            backupName,
            'Automatic backup created before version restore'
        );
    }

    // Restore diagram from snapshot
    const snapshot = version.snapshot;
    updateDiagram(userId, diagramId, {
        name: snapshot.name,
        databaseType: snapshot.databaseType,
        databaseEdition: snapshot.databaseEdition,
        tables: snapshot.tables,
        relationships: snapshot.relationships,
        dependencies: snapshot.dependencies,
        areas: snapshot.areas,
        customTypes: snapshot.customTypes,
        notes: snapshot.notes,
    });

    // Return updated diagram
    return getDiagram(userId, diagramId, {
        includeTables: true,
        includeRelationships: true,
        includeDependencies: true,
        includeAreas: true,
        includeCustomTypes: true,
        includeNotes: true,
    });
};

export const deleteVersion = (userId: string, versionId: string): void => {
    const result = db
        .prepare('DELETE FROM diagram_versions WHERE id = ? AND user_id = ?')
        .run(versionId, userId);

    if (result.changes === 0) {
        throw new AppError(404, 'Version not found');
    }
};
