import { z } from 'zod';

export const versionSchema = z.object({
    id: z.string(),
    diagramId: z.string(),
    userId: z.string(),
    versionName: z.string(),
    description: z.string().optional(),
    createdAt: z.number(),
});

export const versionCreateSchema = z.object({
    params: z.object({ diagramId: z.string() }),
    body: z.object({
        versionName: z.string(),
        description: z.string().optional(),
    }),
});
