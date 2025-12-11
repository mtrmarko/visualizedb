import { z } from 'zod';

export const entityIdParam = z.object({
    id: z.string(),
});

export const tableIdParam = entityIdParam.extend({
    tableId: z.string(),
});

export const relationshipIdParam = entityIdParam.extend({
    relationshipId: z.string(),
});

export const dependencyIdParam = entityIdParam.extend({
    dependencyId: z.string(),
});

export const areaIdParam = entityIdParam.extend({
    areaId: z.string(),
});

export const customTypeIdParam = entityIdParam.extend({
    customTypeId: z.string(),
});

export const noteIdParam = entityIdParam.extend({
    noteId: z.string(),
});

export const entityPayload = (key: string) =>
    z.object({
        [key]: z.record(z.string(), z.any()),
    });

export const attributesPayload = z.object({
    attributes: z.record(z.string(), z.any()),
});
