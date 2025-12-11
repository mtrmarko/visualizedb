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
            await apiClient.post(`/diagrams/${diagramId}/tables`, { table });
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
        try {
            const response = await apiClient.get(
                `/diagrams/${diagramId}/tables/${id}`
            );
            return response.data.table;
        } catch (error) {
            console.error('Failed to get table:', error);
            return undefined;
        }
    };

    const updateTable = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<DBTable>;
    }): Promise<void> => {
        await apiClient.put(`/diagrams/tables/${id}`, { attributes });
    };

    const putTable = async ({
        diagramId,
        table,
    }: {
        diagramId: string;
        table: DBTable;
    }): Promise<void> => {
        await apiClient.put(`/diagrams/${diagramId}/tables/${table.id}`, {
            table,
        });
    };

    const deleteTable = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<void> => {
        await apiClient.delete(`/diagrams/${diagramId}/tables/${id}`);
    };

    const listTables = async (diagramId: string): Promise<DBTable[]> => {
        const response = await apiClient.get(`/diagrams/${diagramId}/tables`);
        return response.data.tables || [];
    };

    const deleteDiagramTables = async (diagramId: string): Promise<void> => {
        await apiClient.delete(`/diagrams/${diagramId}/tables`);
    };

    // Relationship operations
    const addRelationship = async ({
        diagramId,
        relationship,
    }: {
        diagramId: string;
        relationship: DBRelationship;
    }): Promise<void> => {
        await apiClient.post(`/diagrams/${diagramId}/relationships`, {
            relationship,
        });
    };

    const getRelationship = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<DBRelationship | undefined> => {
        try {
            const response = await apiClient.get(
                `/diagrams/${diagramId}/relationships/${id}`
            );
            return response.data.relationship;
        } catch (error) {
            console.error('Failed to get relationship:', error);
            return undefined;
        }
    };

    const updateRelationship = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<DBRelationship>;
    }): Promise<void> => {
        await apiClient.put(`/diagrams/relationships/${id}`, { attributes });
    };

    const deleteRelationship = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<void> => {
        await apiClient.delete(`/diagrams/${diagramId}/relationships/${id}`);
    };

    const listRelationships = async (
        diagramId: string
    ): Promise<DBRelationship[]> => {
        const response = await apiClient.get(
            `/diagrams/${diagramId}/relationships`
        );
        return response.data.relationships || [];
    };

    const deleteDiagramRelationships = async (
        diagramId: string
    ): Promise<void> => {
        await apiClient.delete(`/diagrams/${diagramId}/relationships`);
    };

    // Dependency operations
    const addDependency = async ({
        diagramId,
        dependency,
    }: {
        diagramId: string;
        dependency: DBDependency;
    }): Promise<void> => {
        await apiClient.post(`/diagrams/${diagramId}/dependencies`, {
            dependency,
        });
    };

    const getDependency = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<DBDependency | undefined> => {
        try {
            const response = await apiClient.get(
                `/diagrams/${diagramId}/dependencies/${id}`
            );
            return response.data.dependency;
        } catch (error) {
            console.error('Failed to get dependency:', error);
            return undefined;
        }
    };

    const updateDependency = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<DBDependency>;
    }): Promise<void> => {
        await apiClient.put(`/diagrams/dependencies/${id}`, { attributes });
    };

    const deleteDependency = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<void> => {
        await apiClient.delete(`/diagrams/${diagramId}/dependencies/${id}`);
    };

    const listDependencies = async (
        diagramId: string
    ): Promise<DBDependency[]> => {
        const response = await apiClient.get(
            `/diagrams/${diagramId}/dependencies`
        );
        return response.data.dependencies || [];
    };

    const deleteDiagramDependencies = async (
        diagramId: string
    ): Promise<void> => {
        await apiClient.delete(`/diagrams/${diagramId}/dependencies`);
    };

    // Area operations
    const addArea = async ({
        diagramId,
        area,
    }: {
        diagramId: string;
        area: Area;
    }): Promise<void> => {
        await apiClient.post(`/diagrams/${diagramId}/areas`, { area });
    };

    const getArea = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<Area | undefined> => {
        try {
            const response = await apiClient.get(
                `/diagrams/${diagramId}/areas/${id}`
            );
            return response.data.area;
        } catch (error) {
            console.error('Failed to get area:', error);
            return undefined;
        }
    };

    const updateArea = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<Area>;
    }): Promise<void> => {
        await apiClient.put(`/diagrams/areas/${id}`, { attributes });
    };

    const deleteArea = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<void> => {
        await apiClient.delete(`/diagrams/${diagramId}/areas/${id}`);
    };

    const listAreas = async (diagramId: string): Promise<Area[]> => {
        const response = await apiClient.get(`/diagrams/${diagramId}/areas`);
        return response.data.areas || [];
    };

    const deleteDiagramAreas = async (diagramId: string): Promise<void> => {
        await apiClient.delete(`/diagrams/${diagramId}/areas`);
    };

    // Custom type operations
    const addCustomType = async ({
        diagramId,
        customType,
    }: {
        diagramId: string;
        customType: DBCustomType;
    }): Promise<void> => {
        await apiClient.post(`/diagrams/${diagramId}/custom-types`, {
            customType,
        });
    };

    const getCustomType = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<DBCustomType | undefined> => {
        try {
            const response = await apiClient.get(
                `/diagrams/${diagramId}/custom-types/${id}`
            );
            return response.data.customType;
        } catch (error) {
            console.error('Failed to get custom type:', error);
            return undefined;
        }
    };

    const updateCustomType = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<DBCustomType>;
    }): Promise<void> => {
        await apiClient.put(`/diagrams/custom-types/${id}`, { attributes });
    };

    const deleteCustomType = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<void> => {
        await apiClient.delete(`/diagrams/${diagramId}/custom-types/${id}`);
    };

    const listCustomTypes = async (
        diagramId: string
    ): Promise<DBCustomType[]> => {
        const response = await apiClient.get(
            `/diagrams/${diagramId}/custom-types`
        );
        return response.data.customTypes || [];
    };

    const deleteDiagramCustomTypes = async (
        diagramId: string
    ): Promise<void> => {
        await apiClient.delete(`/diagrams/${diagramId}/custom-types`);
    };

    // Note operations
    const addNote = async ({
        diagramId,
        note,
    }: {
        diagramId: string;
        note: Note;
    }): Promise<void> => {
        await apiClient.post(`/diagrams/${diagramId}/notes`, { note });
    };

    const getNote = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<Note | undefined> => {
        try {
            const response = await apiClient.get(
                `/diagrams/${diagramId}/notes/${id}`
            );
            return response.data.note;
        } catch (error) {
            console.error('Failed to get note:', error);
            return undefined;
        }
    };

    const updateNote = async ({
        id,
        attributes,
    }: {
        id: string;
        attributes: Partial<Note>;
    }): Promise<void> => {
        await apiClient.put(`/diagrams/notes/${id}`, { attributes });
    };

    const deleteNote = async ({
        diagramId,
        id,
    }: {
        diagramId: string;
        id: string;
    }): Promise<void> => {
        await apiClient.delete(`/diagrams/${diagramId}/notes/${id}`);
    };

    const listNotes = async (diagramId: string): Promise<Note[]> => {
        const response = await apiClient.get(`/diagrams/${diagramId}/notes`);
        return response.data.notes || [];
    };

    const deleteDiagramNotes = async (diagramId: string): Promise<void> => {
        await apiClient.delete(`/diagrams/${diagramId}/notes`);
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
