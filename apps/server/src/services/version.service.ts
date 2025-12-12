/* eslint-disable @typescript-eslint/no-explicit-any */
import { nanoid } from 'nanoid';
import { prisma } from '../config/database';
import { AppError } from '../middleware/error-handler';
import { getDiagram, updateDiagram } from './diagram.service';
import type { DiagramVersion } from '@visualizedb/shared';

export const createVersion = async (
    userId: string,
    diagramId: string,
    versionName: string,
    description?: string
): Promise<DiagramVersion> => {
    // Fetch current diagram state with all nested data
    const diagram = await getDiagram(userId, diagramId, {
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

    const version = await prisma.diagramVersion.create({
        data: {
            id: versionId,
            diagramId,
            userId,
            versionName,
            description: description || null,
            snapshotJson,
            createdAt: now,
        },
    });

    return {
        id: version.id,
        diagramId: version.diagramId,
        userId: version.userId,
        versionName: version.versionName,
        description: version.description || undefined,
        createdAt: version.createdAt,
    };
};

export const listVersions = async (
    userId: string,
    diagramId: string
): Promise<DiagramVersion[]> => {
    const versions = await prisma.diagramVersion.findMany({
        where: {
            diagramId,
            userId,
        },
        select: {
            id: true,
            diagramId: true,
            userId: true,
            versionName: true,
            description: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return versions.map((version) => ({
        id: version.id,
        diagramId: version.diagramId,
        userId: version.userId,
        versionName: version.versionName,
        description: version.description || undefined,
        createdAt: version.createdAt,
    }));
};

export const getVersion = async (
    userId: string,
    versionId: string
): Promise<any> => {
    const version = await prisma.diagramVersion.findFirst({
        where: {
            id: versionId,
            userId,
        },
    });

    if (!version) {
        throw new AppError(404, 'Version not found');
    }

    return {
        id: version.id,
        diagramId: version.diagramId,
        userId: version.userId,
        versionName: version.versionName,
        description: version.description || undefined,
        snapshot: JSON.parse(version.snapshotJson),
        createdAt: version.createdAt,
    };
};

export const restoreVersion = async (
    userId: string,
    diagramId: string,
    versionId: string
): Promise<any> => {
    // Fetch version snapshot
    const version = await getVersion(userId, versionId);

    if (version.diagramId !== diagramId) {
        throw new AppError(400, 'Version does not belong to this diagram');
    }

    // Create auto-backup before restore
    const currentDiagram = await getDiagram(userId, diagramId, {
        includeTables: true,
        includeRelationships: true,
        includeDependencies: true,
        includeAreas: true,
        includeCustomTypes: true,
        includeNotes: true,
    });

    if (currentDiagram) {
        const backupName = `Auto-backup before restore to "${version.versionName}"`;
        await createVersion(
            userId,
            diagramId,
            backupName,
            'Automatic backup created before version restore'
        );
    }

    // Restore diagram from snapshot
    const snapshot = version.snapshot;
    await updateDiagram(userId, diagramId, {
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

export const deleteVersion = async (
    userId: string,
    versionId: string
): Promise<void> => {
    const result = await prisma.diagramVersion.deleteMany({
        where: {
            id: versionId,
            userId,
        },
    });

    if (result.count === 0) {
        throw new AppError(404, 'Version not found');
    }
};
