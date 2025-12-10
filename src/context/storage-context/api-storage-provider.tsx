import React from 'react';
import type { ReactNode } from 'react';
import { storageContext } from './storage-context';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { DBDependency } from '@/lib/domain/db-dependency';
import type { Area } from '@/lib/domain/area';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import type { Note } from '@/lib/domain/note';
import type { VisualizeDBConfig } from '@/lib/domain/config';
import type { DiagramFilter } from '@/lib/domain/diagram-filter/diagram-filter';
import { apiClient } from '@/services/api-client';

export interface ApiStorageProviderProps {
    children: ReactNode;
}

// Queue to serialize addTable operations and prevent race conditions
let addTableQueue: Promise<void> = Promise.resolve();

export const ApiStorageProvider: React.FC<ApiStorageProviderProps> = ({
    children,
}) => {
    // Helper function to build include query params
    const buildIncludeParams = (options?: {
        includeTables?: boolean;
        includeRelationships?: boolean;
        includeDependencies?: boolean;
        includeAreas?: boolean;
        includeCustomTypes?: boolean;
        includeNotes?: boolean;
    }) => {
        if (!options) return '';

        const includes: string[] = [];
        if (options.includeTables) includes.push('tables');
        if (options.includeRelationships) includes.push('relationships');
        if (options.includeDependencies) includes.push('dependencies');
        if (options.includeAreas) includes.push('areas');
        if (options.includeCustomTypes) includes.push('customTypes');
        if (options.includeNotes) includes.push('notes');

        return includes.length > 0 ? `?include=${includes.join(',')}` : '';
    };

    // Config operations
    const getConfig = async (): Promise<VisualizeDBConfig | undefined> => {
        try {
            const response = await apiClient.get('/diagrams/config');
            return response.data.config;
        } catch (error) {
            console.error('Failed to get config:', error);
            return undefined;
        }
    };

    const updateConfig = async (
        config: Partial<VisualizeDBConfig>
    ): Promise<void> => {
        await apiClient.put('/diagrams/config', { config });
    };

    // Diagram filter operations
    const getDiagramFilter = async (
        diagramId: string
    ): Promise<DiagramFilter | undefined> => {
        try {
            const response = await apiClient.get(
                `/diagrams/${diagramId}/filter`
            );
            return response.data.filter;
        } catch (error) {
            console.error('Failed to get diagram filter:', error);
            return undefined;
        }
    };

    const updateDiagramFilter = async (
        diagramId: string,
        filter: DiagramFilter
    ): Promise<void> => {
        console.log('updateDiagramFilter called with:', filter);
        await apiClient.put(`/diagrams/${diagramId}/filter`, { filter });
    };

    const deleteDiagramFilter = async (diagramId: string): Promise<void> => {
        await apiClient.delete(`/diagrams/${diagramId}/filter`);
    };

    // Diagram operations
    const addDiagram = async ({
        diagram,
    }: {
        diagram: Diagram;
    }): Promise<void> => {
        await apiClient.post('/diagrams', { diagram });
    };

    const listDiagrams = async (options?: {
        includeTables?: boolean;
        includeRelationships?: boolean;
        includeDependencies?: boolean;
        includeAreas?: boolean;
        includeCustomTypes?: boolean;
        includeNotes?: boolean;
    }): Promise<Diagram[]> => {
        const params = buildIncludeParams(options);
        const response = await apiClient.get(`/diagrams${params}`);
        return response.data.diagrams;
    };

    const getDiagram = async (
        id: string,
        options?: {
            includeTables?: boolean;
            includeRelationships?: boolean;
            includeDependencies?: boolean;
            includeAreas?: boolean;
            includeCustomTypes?: boolean;
            includeNotes?: boolean;
        }
    ): Promise<Diagram | undefined> => {
        try {
            const params = buildIncludeParams(options);
            const response = await apiClient.get(`/diagrams/${id}${params}`);
            const diagram = response.data.diagram;
            console.log('API getDiagram response:', diagram);
            console.log('Tables count:', diagram?.tables?.length);
            console.log('First table:', diagram?.tables?.[0]);
            return diagram;
        } catch (error) {
            console.error('Failed to get diagram:', error);
            return undefined;
        }
    };

    const updateDiagram = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<Diagram>;
    }): Promise<void> => {
        if (attributes.tables) {
            console.log(
                'updateDiagram - updating tables, first 3 tables x,y:',
                attributes.tables
                    .slice(0, 3)
                    .map((t) => ({ name: t.name, x: t.x, y: t.y }))
            );
        }
        await apiClient.put(`/diagrams/${id}`, { diagram: attributes });
    };

    const deleteDiagram = async (id: string): Promise<void> => {
        await apiClient.delete(`/diagrams/${id}`);
    };

    // Table operations
    const addTable = async ({
        diagramId,
        table,
    }: {
        diagramId: string;
        table: DBTable;
    }): Promise<void> => {
        // Queue this operation to prevent race conditions when adding multiple tables
        const operation = async () => {
            const diagram = await getDiagram(diagramId, {
                includeTables: true,
            });
            if (!diagram) throw new Error('Diagram not found');

            console.log(
                'addTable - fetched diagram with',
                diagram.tables?.length || 0,
                'tables, adding',
                table.name,
                'at position x:',
                table.x,
                'y:',
                table.y
            );
            const tables = [...(diagram.tables || []), table];
            console.log(
                'addTable - saving with',
                tables.length,
                'tables, last table:',
                tables[tables.length - 1]?.name,
                'x:',
                tables[tables.length - 1]?.x,
                'y:',
                tables[tables.length - 1]?.y
            );
            await updateDiagram({ id: diagramId, attributes: { tables } });
        };

        addTableQueue = addTableQueue.then(operation, operation);
        await addTableQueue;
    };

    const getTable = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<DBTable | undefined> => {
        const diagram = await getDiagram(diagramId, { includeTables: true });
        return diagram?.tables?.find((t) => t.id === id);
    };

    const updateTable = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<DBTable>;
    }): Promise<void> => {
        // We need to find which diagram this table belongs to
        // This requires fetching all diagrams (not ideal, but necessary with current API)
        const diagrams = await listDiagrams({ includeTables: true });
        const diagram = diagrams.find((d) =>
            d.tables?.some((t) => t.id === id)
        );

        if (!diagram) throw new Error('Table not found');

        const tables = diagram.tables?.map((t) =>
            t.id === id ? { ...t, ...attributes } : t
        );
        await updateDiagram({ id: diagram.id, attributes: { tables } });
    };

    const putTable = async ({
        diagramId,
        table,
    }: {
        diagramId: string;
        table: DBTable;
    }): Promise<void> => {
        const diagram = await getDiagram(diagramId, { includeTables: true });
        if (!diagram) throw new Error('Diagram not found');

        const tables = diagram.tables?.map((t) =>
            t.id === table.id ? table : t
        );
        await updateDiagram({ id: diagramId, attributes: { tables } });
    };

    const deleteTable = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<void> => {
        const diagram = await getDiagram(diagramId, { includeTables: true });
        if (!diagram) throw new Error('Diagram not found');

        const tables = diagram.tables?.filter((t) => t.id !== id);
        await updateDiagram({ id: diagramId, attributes: { tables } });
    };

    const listTables = async (diagramId: string): Promise<DBTable[]> => {
        const diagram = await getDiagram(diagramId, { includeTables: true });
        return diagram?.tables || [];
    };

    const deleteDiagramTables = async (diagramId: string): Promise<void> => {
        await updateDiagram({ id: diagramId, attributes: { tables: [] } });
    };

    // Relationship operations
    const addRelationship = async ({
        diagramId,
        relationship,
    }: {
        diagramId: string;
        relationship: DBRelationship;
    }): Promise<void> => {
        const diagram = await getDiagram(diagramId, {
            includeRelationships: true,
        });
        if (!diagram) throw new Error('Diagram not found');

        const relationships = [...(diagram.relationships || []), relationship];
        await updateDiagram({ id: diagramId, attributes: { relationships } });
    };

    const getRelationship = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<DBRelationship | undefined> => {
        const diagram = await getDiagram(diagramId, {
            includeRelationships: true,
        });
        return diagram?.relationships?.find((r) => r.id === id);
    };

    const updateRelationship = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<DBRelationship>;
    }): Promise<void> => {
        const diagrams = await listDiagrams({ includeRelationships: true });
        const diagram = diagrams.find((d) =>
            d.relationships?.some((r) => r.id === id)
        );

        if (!diagram) throw new Error('Relationship not found');

        const relationships = diagram.relationships?.map((r) =>
            r.id === id ? { ...r, ...attributes } : r
        );
        await updateDiagram({ id: diagram.id, attributes: { relationships } });
    };

    const deleteRelationship = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<void> => {
        const diagram = await getDiagram(diagramId, {
            includeRelationships: true,
        });
        if (!diagram) throw new Error('Diagram not found');

        const relationships = diagram.relationships?.filter((r) => r.id !== id);
        await updateDiagram({ id: diagramId, attributes: { relationships } });
    };

    const listRelationships = async (
        diagramId: string
    ): Promise<DBRelationship[]> => {
        const diagram = await getDiagram(diagramId, {
            includeRelationships: true,
        });
        return diagram?.relationships || [];
    };

    const deleteDiagramRelationships = async (
        diagramId: string
    ): Promise<void> => {
        await updateDiagram({
            id: diagramId,
            attributes: { relationships: [] },
        });
    };

    // Dependency operations
    const addDependency = async ({
        diagramId,
        dependency,
    }: {
        diagramId: string;
        dependency: DBDependency;
    }): Promise<void> => {
        const diagram = await getDiagram(diagramId, {
            includeDependencies: true,
        });
        if (!diagram) throw new Error('Diagram not found');

        const dependencies = [...(diagram.dependencies || []), dependency];
        await updateDiagram({ id: diagramId, attributes: { dependencies } });
    };

    const getDependency = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<DBDependency | undefined> => {
        const diagram = await getDiagram(diagramId, {
            includeDependencies: true,
        });
        return diagram?.dependencies?.find((d) => d.id === id);
    };

    const updateDependency = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<DBDependency>;
    }): Promise<void> => {
        const diagrams = await listDiagrams({ includeDependencies: true });
        const diagram = diagrams.find((d) =>
            d.dependencies?.some((dep) => dep.id === id)
        );

        if (!diagram) throw new Error('Dependency not found');

        const dependencies = diagram.dependencies?.map((dep) =>
            dep.id === id ? { ...dep, ...attributes } : dep
        );
        await updateDiagram({ id: diagram.id, attributes: { dependencies } });
    };

    const deleteDependency = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<void> => {
        const diagram = await getDiagram(diagramId, {
            includeDependencies: true,
        });
        if (!diagram) throw new Error('Diagram not found');

        const dependencies = diagram.dependencies?.filter((d) => d.id !== id);
        await updateDiagram({ id: diagramId, attributes: { dependencies } });
    };

    const listDependencies = async (
        diagramId: string
    ): Promise<DBDependency[]> => {
        const diagram = await getDiagram(diagramId, {
            includeDependencies: true,
        });
        return diagram?.dependencies || [];
    };

    const deleteDiagramDependencies = async (
        diagramId: string
    ): Promise<void> => {
        await updateDiagram({
            id: diagramId,
            attributes: { dependencies: [] },
        });
    };

    // Area operations
    const addArea = async ({
        diagramId,
        area,
    }: {
        diagramId: string;
        area: Area;
    }): Promise<void> => {
        const diagram = await getDiagram(diagramId, { includeAreas: true });
        if (!diagram) throw new Error('Diagram not found');

        const areas = [...(diagram.areas || []), area];
        await updateDiagram({ id: diagramId, attributes: { areas } });
    };

    const getArea = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<Area | undefined> => {
        const diagram = await getDiagram(diagramId, { includeAreas: true });
        return diagram?.areas?.find((a) => a.id === id);
    };

    const updateArea = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<Area>;
    }): Promise<void> => {
        const diagrams = await listDiagrams({ includeAreas: true });
        const diagram = diagrams.find((d) => d.areas?.some((a) => a.id === id));

        if (!diagram) throw new Error('Area not found');

        const areas = diagram.areas?.map((a) =>
            a.id === id ? { ...a, ...attributes } : a
        );
        await updateDiagram({ id: diagram.id, attributes: { areas } });
    };

    const deleteArea = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<void> => {
        const diagram = await getDiagram(diagramId, { includeAreas: true });
        if (!diagram) throw new Error('Diagram not found');

        const areas = diagram.areas?.filter((a) => a.id !== id);
        await updateDiagram({ id: diagramId, attributes: { areas } });
    };

    const listAreas = async (diagramId: string): Promise<Area[]> => {
        const diagram = await getDiagram(diagramId, { includeAreas: true });
        return diagram?.areas || [];
    };

    const deleteDiagramAreas = async (diagramId: string): Promise<void> => {
        await updateDiagram({ id: diagramId, attributes: { areas: [] } });
    };

    // Custom type operations
    const addCustomType = async ({
        diagramId,
        customType,
    }: {
        diagramId: string;
        customType: DBCustomType;
    }): Promise<void> => {
        const diagram = await getDiagram(diagramId, {
            includeCustomTypes: true,
        });
        if (!diagram) throw new Error('Diagram not found');

        const customTypes = [...(diagram.customTypes || []), customType];
        await updateDiagram({ id: diagramId, attributes: { customTypes } });
    };

    const getCustomType = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<DBCustomType | undefined> => {
        const diagram = await getDiagram(diagramId, {
            includeCustomTypes: true,
        });
        return diagram?.customTypes?.find((ct) => ct.id === id);
    };

    const updateCustomType = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<DBCustomType>;
    }): Promise<void> => {
        const diagrams = await listDiagrams({ includeCustomTypes: true });
        const diagram = diagrams.find((d) =>
            d.customTypes?.some((ct) => ct.id === id)
        );

        if (!diagram) throw new Error('Custom type not found');

        const customTypes = diagram.customTypes?.map((ct) =>
            ct.id === id ? { ...ct, ...attributes } : ct
        );
        await updateDiagram({ id: diagram.id, attributes: { customTypes } });
    };

    const deleteCustomType = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<void> => {
        const diagram = await getDiagram(diagramId, {
            includeCustomTypes: true,
        });
        if (!diagram) throw new Error('Diagram not found');

        const customTypes = diagram.customTypes?.filter((ct) => ct.id !== id);
        await updateDiagram({ id: diagramId, attributes: { customTypes } });
    };

    const listCustomTypes = async (
        diagramId: string
    ): Promise<DBCustomType[]> => {
        const diagram = await getDiagram(diagramId, {
            includeCustomTypes: true,
        });
        return diagram?.customTypes || [];
    };

    const deleteDiagramCustomTypes = async (
        diagramId: string
    ): Promise<void> => {
        await updateDiagram({ id: diagramId, attributes: { customTypes: [] } });
    };

    // Note operations
    const addNote = async ({
        diagramId,
        note,
    }: {
        diagramId: string;
        note: Note;
    }): Promise<void> => {
        const diagram = await getDiagram(diagramId, { includeNotes: true });
        if (!diagram) throw new Error('Diagram not found');

        const notes = [...(diagram.notes || []), note];
        await updateDiagram({ id: diagramId, attributes: { notes } });
    };

    const getNote = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<Note | undefined> => {
        const diagram = await getDiagram(diagramId, { includeNotes: true });
        return diagram?.notes?.find((n) => n.id === id);
    };

    const updateNote = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<Note>;
    }): Promise<void> => {
        const diagrams = await listDiagrams({ includeNotes: true });
        const diagram = diagrams.find((d) => d.notes?.some((n) => n.id === id));

        if (!diagram) throw new Error('Note not found');

        const notes = diagram.notes?.map((n) =>
            n.id === id ? { ...n, ...attributes } : n
        );
        await updateDiagram({ id: diagram.id, attributes: { notes } });
    };

    const deleteNote = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<void> => {
        const diagram = await getDiagram(diagramId, { includeNotes: true });
        if (!diagram) throw new Error('Diagram not found');

        const notes = diagram.notes?.filter((n) => n.id !== id);
        await updateDiagram({ id: diagramId, attributes: { notes } });
    };

    const listNotes = async (diagramId: string): Promise<Note[]> => {
        const diagram = await getDiagram(diagramId, { includeNotes: true });
        return diagram?.notes || [];
    };

    const deleteDiagramNotes = async (diagramId: string): Promise<void> => {
        await updateDiagram({ id: diagramId, attributes: { notes: [] } });
    };

    const value = {
        getConfig,
        updateConfig,
        getDiagramFilter,
        updateDiagramFilter,
        deleteDiagramFilter,
        addDiagram,
        listDiagrams,
        getDiagram,
        updateDiagram,
        deleteDiagram,
        addTable,
        getTable,
        updateTable,
        putTable,
        deleteTable,
        listTables,
        deleteDiagramTables,
        addRelationship,
        getRelationship,
        updateRelationship,
        deleteRelationship,
        listRelationships,
        deleteDiagramRelationships,
        addDependency,
        getDependency,
        updateDependency,
        deleteDependency,
        listDependencies,
        deleteDiagramDependencies,
        addArea,
        getArea,
        updateArea,
        deleteArea,
        listAreas,
        deleteDiagramAreas,
        addCustomType,
        getCustomType,
        updateCustomType,
        deleteCustomType,
        listCustomTypes,
        deleteDiagramCustomTypes,
        addNote,
        getNote,
        updateNote,
        deleteNote,
        listNotes,
        deleteDiagramNotes,
    };

    return (
        <storageContext.Provider value={value}>
            {children}
        </storageContext.Provider>
    );
};
