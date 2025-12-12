import { z } from 'zod';

const entityArray = z.array(z.record(z.string(), z.any()));

export const diagramSchema = z.object({
    id: z.string(),
    name: z.string(),
    databaseType: z.string(),
    databaseEdition: z.string().nullable().optional(),
    tables: entityArray.optional(),
    relationships: entityArray.optional(),
    dependencies: entityArray.optional(),
    areas: entityArray.optional(),
    customTypes: entityArray.optional(),
    notes: entityArray.optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export const diagramFilterSchema = z.object({
    tableIds: z.array(z.string()).optional(),
    schemaIds: z.array(z.string()).optional(),
});

export const diagramCreateSchema = z.object({
    body: z.object({
        diagram: diagramSchema.partial().extend({
            id: z.string().optional(),
            createdAt: z.any().optional(),
            updatedAt: z.any().optional(),
        }),
    }),
});

export const diagramUpdateSchema = z.object({
    params: z.object({ id: z.string() }),
    body: z.object({
        diagram: diagramSchema.partial(),
    }),
});

export const includeQuery = z
    .string()
    .describe(
        'Comma separated list of nested entities to include: tables,relationships,dependencies,areas,customTypes,notes'
    )
    .optional();

export const entityResponse = (key: string) =>
    z.object({ [key]: z.record(z.string(), z.any()) });

export const entityListResponse = (key: string) =>
    z.object({ [key]: entityArray });
