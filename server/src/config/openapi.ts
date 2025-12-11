import { createDocument } from 'zod-openapi';
import { z } from 'zod';
import {
    authResponseSchema,
    loginRequestSchema,
    refreshResponseSchema,
    signupRequestSchema,
    userSchema,
} from '../schemas/auth.schema';
import {
    diagramCreateSchema,
    diagramFilterSchema,
    diagramSchema,
    diagramUpdateSchema,
    includeQuery,
} from '../schemas/diagram.schema';
import {
    areaIdParam,
    attributesPayload,
    customTypeIdParam,
    dependencyIdParam,
    entityIdParam,
    noteIdParam,
    relationshipIdParam,
    tableIdParam,
} from '../schemas/entity.schema';
import { versionCreateSchema, versionSchema } from '../schemas/version.schema';
import { config } from './env';

// Static schemas for OpenAPI (avoids Zod v4 computed key issues)
const genericEntityPayload = z.record(z.string(), z.any());
const genericEntityResponse = z.record(z.string(), z.any());
const genericEntityListResponse = z.array(z.record(z.string(), z.any()));
const genericEntityIdParam = z.object({ id: z.string() });

const paths: Record<string, unknown> = {
    '/auth/signup': {
        post: {
            summary: 'Create a new user',
            requestBody: {
                content: {
                    'application/json': { schema: signupRequestSchema },
                },
            },
            responses: {
                201: {
                    description: 'User created',
                    content: {
                        'application/json': { schema: authResponseSchema },
                    },
                },
            },
        },
    },
    '/auth/login': {
        post: {
            summary: 'Login with email and password',
            requestBody: {
                content: {
                    'application/json': { schema: loginRequestSchema },
                },
            },
            responses: {
                200: {
                    description: 'Login success',
                    content: {
                        'application/json': { schema: authResponseSchema },
                    },
                },
            },
        },
    },
    '/auth/refresh': {
        post: {
            summary: 'Exchange refresh cookie for new access token',
            responses: {
                200: {
                    description: 'Token refreshed',
                    content: {
                        'application/json': { schema: refreshResponseSchema },
                    },
                },
            },
        },
    },
    '/auth/logout': {
        post: {
            summary: 'Logout and clear refresh token',
            responses: { 200: { description: 'Logged out' } },
        },
    },
    '/auth/me': {
        get: {
            summary: 'Get current user',
            responses: {
                200: {
                    description: 'Current user',
                    content: {
                        'application/json': {
                            schema: z.object({ user: userSchema }),
                        },
                    },
                },
            },
        },
    },
    '/diagrams': {
        get: {
            summary: 'List diagrams',
            requestParams: {
                query: z.object({ include: includeQuery }),
            },
            responses: {
                200: {
                    description: 'Diagram list',
                    content: {
                        'application/json': {
                            schema: z.object({
                                diagrams: z.array(diagramSchema),
                            }),
                        },
                    },
                },
            },
        },
        post: {
            summary: 'Create diagram',
            requestBody: {
                content: {
                    'application/json': {
                        schema: diagramCreateSchema.shape.body,
                    },
                },
            },
            responses: {
                201: {
                    description: 'Created',
                    content: {
                        'application/json': {
                            schema: z.object({ diagram: diagramSchema }),
                        },
                    },
                },
            },
        },
    },
    '/diagrams/{id}': {
        get: {
            summary: 'Get a diagram',
            requestParams: {
                path: z.object({ id: z.string() }),
                query: z.object({ include: includeQuery }),
            },
            responses: {
                200: {
                    description: 'Diagram',
                    content: {
                        'application/json': {
                            schema: z.object({ diagram: diagramSchema }),
                        },
                    },
                },
                404: { description: 'Not found' },
            },
        },
        put: {
            summary: 'Update a diagram',
            requestParams: {
                path: diagramUpdateSchema.shape.params,
            },
            requestBody: {
                content: {
                    'application/json': {
                        schema: diagramUpdateSchema.shape.body,
                    },
                },
            },
            responses: {
                200: {
                    description: 'Updated',
                    content: {
                        'application/json': {
                            schema: z.object({ diagram: diagramSchema }),
                        },
                    },
                },
            },
        },
        delete: {
            summary: 'Delete a diagram',
            requestParams: { path: z.object({ id: z.string() }) },
            responses: { 200: { description: 'Deleted' } },
        },
    },
    '/diagrams/config': {
        get: {
            summary: 'Get user config',
            responses: {
                200: {
                    description: 'Config',
                    content: {
                        'application/json': {
                            schema: z.object({
                                config: z.record(z.string(), z.any()),
                            }),
                        },
                    },
                },
            },
        },
        put: {
            summary: 'Update user config',
            requestBody: {
                content: {
                    'application/json': {
                        schema: z.object({
                            config: z.record(z.string(), z.any()),
                        }),
                    },
                },
            },
            responses: { 200: { description: 'Updated' } },
        },
    },
    '/diagrams/{id}/filter': {
        get: {
            summary: 'Get diagram filter',
            requestParams: { path: z.object({ id: z.string() }) },
            responses: {
                200: {
                    description: 'Filter',
                    content: {
                        'application/json': {
                            schema: z.object({
                                filter: diagramFilterSchema.nullable(),
                            }),
                        },
                    },
                },
            },
        },
        put: {
            summary: 'Update diagram filter',
            requestParams: { path: z.object({ id: z.string() }) },
            requestBody: {
                content: {
                    'application/json': {
                        schema: z.object({ filter: diagramFilterSchema }),
                    },
                },
            },
            responses: { 200: { description: 'Updated' } },
        },
        delete: {
            summary: 'Delete diagram filter',
            requestParams: { path: z.object({ id: z.string() }) },
            responses: { 200: { description: 'Deleted' } },
        },
    },
    '/diagrams/{diagramId}/versions': {
        get: {
            summary: 'List versions for a diagram',
            requestParams: { path: z.object({ diagramId: z.string() }) },
            responses: {
                200: {
                    description: 'Versions',
                    content: {
                        'application/json': {
                            schema: z.object({
                                versions: z.array(versionSchema),
                            }),
                        },
                    },
                },
            },
        },
        post: {
            summary: 'Create a version snapshot',
            requestParams: {
                path: versionCreateSchema.shape.params,
            },
            requestBody: {
                content: {
                    'application/json': {
                        schema: versionCreateSchema.shape.body,
                    },
                },
            },
            responses: { 201: { description: 'Version created' } },
        },
    },
    '/diagrams/{diagramId}/versions/{versionId}': {
        get: {
            summary: 'Get version with snapshot',
            requestParams: {
                path: z.object({
                    diagramId: z.string(),
                    versionId: z.string(),
                }),
            },
            responses: { 200: { description: 'Version returned' } },
        },
        delete: {
            summary: 'Delete a version',
            requestParams: {
                path: z.object({
                    diagramId: z.string(),
                    versionId: z.string(),
                }),
            },
            responses: { 200: { description: 'Deleted' } },
        },
    },
    '/diagrams/{diagramId}/versions/{versionId}/restore': {
        post: {
            summary: 'Restore diagram to a version',
            requestParams: {
                path: z.object({
                    diagramId: z.string(),
                    versionId: z.string(),
                }),
            },
            responses: { 200: { description: 'Restored' } },
        },
    },
};

const entityPaths = (
    name: string,
    pathKey: string,
    paramKey: string,
    pathParamSchema: z.ZodTypeAny
) => ({
    [`/diagrams/{id}/${pathKey}`]: {
        get: {
            summary: `List ${name}s in a diagram`,
            requestParams: { path: entityIdParam },
            responses: {
                200: {
                    description: `${name}s`,
                    content: {
                        'application/json': {
                            schema: genericEntityListResponse,
                        },
                    },
                },
            },
        },
        post: {
            summary: `Add ${name}`,
            requestParams: { path: entityIdParam },
            requestBody: {
                content: {
                    'application/json': {
                        schema: genericEntityPayload,
                    },
                },
            },
            responses: { 201: { description: `${name} added` } },
        },
        delete: {
            summary: `Delete all ${name}s`,
            requestParams: { path: entityIdParam },
            responses: { 200: { description: `${name}s cleared` } },
        },
    },
    [`/diagrams/{id}/${pathKey}/{${paramKey}}`]: {
        get: {
            summary: `Get ${name}`,
            requestParams: { path: pathParamSchema },
            responses: {
                200: {
                    description: `${name}`,
                    content: {
                        'application/json': {
                            schema: genericEntityResponse,
                        },
                    },
                },
            },
        },
        put: {
            summary: `Replace ${name}`,
            requestParams: { path: pathParamSchema },
            requestBody: {
                content: {
                    'application/json': {
                        schema: genericEntityPayload,
                    },
                },
            },
            responses: { 200: { description: `${name} updated` } },
        },
        delete: {
            summary: `Delete ${name}`,
            requestParams: { path: pathParamSchema },
            responses: { 200: { description: `${name} removed` } },
        },
    },
    [`/diagrams/${pathKey}/{${paramKey}}`]: {
        put: {
            summary: `Update ${name} by id`,
            requestParams: { path: genericEntityIdParam },
            requestBody: {
                content: {
                    'application/json': {
                        schema: attributesPayload,
                    },
                },
            },
            responses: { 200: { description: `${name} updated` } },
        },
    },
});

Object.assign(
    paths,
    entityPaths('table', 'tables', 'tableId', tableIdParam),
    entityPaths(
        'relationship',
        'relationships',
        'relationshipId',
        relationshipIdParam
    ),
    entityPaths(
        'dependency',
        'dependencies',
        'dependencyId',
        dependencyIdParam
    ),
    entityPaths('area', 'areas', 'areaId', areaIdParam),
    entityPaths(
        'customType',
        'custom-types',
        'customTypeId',
        customTypeIdParam
    ),
    entityPaths('note', 'notes', 'noteId', noteIdParam)
);

export const openApiDocument = createDocument({
    openapi: '3.1.0',
    info: {
        title: 'VisualizeDB API',
        version: '1.0.0',
        description:
            'Authentication, diagram persistence, nested entity CRUD, and versions for VisualizeDB.',
    },
    servers: [{ url: `http://localhost:${config.port}/api` }],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    security: [{ bearerAuth: [] }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paths: paths as any,
});
