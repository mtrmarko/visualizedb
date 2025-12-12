import { Router } from 'express';
import {
    create,
    list,
    get,
    update,
    remove,
    getConfig,
    putConfig,
    getFilter,
    putFilter,
    deleteFilter,
} from '../controllers/diagram.controller';
import { authenticate, verifyDiagramOwnership } from '../middleware/auth';
import {
    tableControllers,
    relationshipControllers,
    dependencyControllers,
    areaControllers,
    customTypeControllers,
    noteControllers,
} from '../controllers/entity.controller';
import { validate } from '../middleware/validate';
import {
    diagramCreateSchema,
    diagramUpdateSchema,
} from '../schemas/diagram.schema';
import {
    attributesPayload,
    areaIdParam,
    customTypeIdParam,
    dependencyIdParam,
    entityIdParam,
    noteIdParam,
    relationshipIdParam,
    tableIdParam,
    entityPayload,
} from '../schemas/entity.schema';

const router: Router = Router();

// All diagram routes require authentication
router.use(authenticate);

// Config endpoints
router.get('/config', getConfig);
router.put('/config', putConfig);

// Diagram CRUD
router.post('/', validate(diagramCreateSchema), create);
router.get('/', list);
router.get('/:id', verifyDiagramOwnership, get);
router.put(
    '/:id',
    verifyDiagramOwnership,
    validate(diagramUpdateSchema),
    update
);
router.delete('/:id', verifyDiagramOwnership, remove);

// Filter endpoints
router.get('/:id/filter', verifyDiagramOwnership, getFilter);
router.put(
    '/:id/filter',
    verifyDiagramOwnership,
    validate(entityPayload('filter')),
    putFilter
);
router.delete('/:id/filter', verifyDiagramOwnership, deleteFilter);

// Table endpoints
router.get(
    '/:id/tables',
    verifyDiagramOwnership,
    validate(entityIdParam),
    tableControllers.list
);
router.post(
    '/:id/tables',
    verifyDiagramOwnership,
    validate(entityPayload('table')),
    tableControllers.add
);
router.get(
    '/:id/tables/:tableId',
    verifyDiagramOwnership,
    validate(tableIdParam),
    tableControllers.get
);
router.put(
    '/:id/tables/:tableId',
    verifyDiagramOwnership,
    validate(entityPayload('table')),
    tableControllers.replace
);
router.delete(
    '/:id/tables/:tableId',
    verifyDiagramOwnership,
    validate(tableIdParam),
    tableControllers.remove
);
router.delete('/:id/tables', verifyDiagramOwnership, tableControllers.clear);
router.put(
    '/tables/:tableId',
    validate(attributesPayload),
    tableControllers.updateById
);

// Relationship endpoints
router.get(
    '/:id/relationships',
    verifyDiagramOwnership,
    validate(entityIdParam),
    relationshipControllers.list
);
router.post(
    '/:id/relationships',
    verifyDiagramOwnership,
    validate(entityPayload('relationship')),
    relationshipControllers.add
);
router.get(
    '/:id/relationships/:relationshipId',
    verifyDiagramOwnership,
    validate(relationshipIdParam),
    relationshipControllers.get
);
router.put(
    '/:id/relationships/:relationshipId',
    verifyDiagramOwnership,
    validate(entityPayload('relationship')),
    relationshipControllers.replace
);
router.delete(
    '/:id/relationships/:relationshipId',
    verifyDiagramOwnership,
    validate(relationshipIdParam),
    relationshipControllers.remove
);
router.delete(
    '/:id/relationships',
    verifyDiagramOwnership,
    relationshipControllers.clear
);
router.put(
    '/relationships/:relationshipId',
    validate(attributesPayload),
    relationshipControllers.updateById
);

// Dependency endpoints
router.get(
    '/:id/dependencies',
    verifyDiagramOwnership,
    validate(entityIdParam),
    dependencyControllers.list
);
router.post(
    '/:id/dependencies',
    verifyDiagramOwnership,
    validate(entityPayload('dependency')),
    dependencyControllers.add
);
router.get(
    '/:id/dependencies/:dependencyId',
    verifyDiagramOwnership,
    validate(dependencyIdParam),
    dependencyControllers.get
);
router.put(
    '/:id/dependencies/:dependencyId',
    verifyDiagramOwnership,
    validate(entityPayload('dependency')),
    dependencyControllers.replace
);
router.delete(
    '/:id/dependencies/:dependencyId',
    verifyDiagramOwnership,
    validate(dependencyIdParam),
    dependencyControllers.remove
);
router.delete(
    '/:id/dependencies',
    verifyDiagramOwnership,
    dependencyControllers.clear
);
router.put(
    '/dependencies/:dependencyId',
    validate(attributesPayload),
    dependencyControllers.updateById
);

// Area endpoints
router.get(
    '/:id/areas',
    verifyDiagramOwnership,
    validate(entityIdParam),
    areaControllers.list
);
router.post(
    '/:id/areas',
    verifyDiagramOwnership,
    validate(entityPayload('area')),
    areaControllers.add
);
router.get(
    '/:id/areas/:areaId',
    verifyDiagramOwnership,
    validate(areaIdParam),
    areaControllers.get
);
router.put(
    '/:id/areas/:areaId',
    verifyDiagramOwnership,
    validate(entityPayload('area')),
    areaControllers.replace
);
router.delete(
    '/:id/areas/:areaId',
    verifyDiagramOwnership,
    validate(areaIdParam),
    areaControllers.remove
);
router.delete('/:id/areas', verifyDiagramOwnership, areaControllers.clear);
router.put(
    '/areas/:areaId',
    validate(attributesPayload),
    areaControllers.updateById
);

// Custom type endpoints
router.get(
    '/:id/custom-types',
    verifyDiagramOwnership,
    validate(entityIdParam),
    customTypeControllers.list
);
router.post(
    '/:id/custom-types',
    verifyDiagramOwnership,
    validate(entityPayload('customType')),
    customTypeControllers.add
);
router.get(
    '/:id/custom-types/:customTypeId',
    verifyDiagramOwnership,
    validate(customTypeIdParam),
    customTypeControllers.get
);
router.put(
    '/:id/custom-types/:customTypeId',
    verifyDiagramOwnership,
    validate(entityPayload('customType')),
    customTypeControllers.replace
);
router.delete(
    '/:id/custom-types/:customTypeId',
    verifyDiagramOwnership,
    validate(customTypeIdParam),
    customTypeControllers.remove
);
router.delete(
    '/:id/custom-types',
    verifyDiagramOwnership,
    customTypeControllers.clear
);
router.put(
    '/custom-types/:customTypeId',
    validate(attributesPayload),
    customTypeControllers.updateById
);

// Note endpoints
router.get(
    '/:id/notes',
    verifyDiagramOwnership,
    validate(entityIdParam),
    noteControllers.list
);
router.post(
    '/:id/notes',
    verifyDiagramOwnership,
    validate(entityPayload('note')),
    noteControllers.add
);
router.get(
    '/:id/notes/:noteId',
    verifyDiagramOwnership,
    validate(noteIdParam),
    noteControllers.get
);
router.put(
    '/:id/notes/:noteId',
    verifyDiagramOwnership,
    validate(entityPayload('note')),
    noteControllers.replace
);
router.delete(
    '/:id/notes/:noteId',
    verifyDiagramOwnership,
    validate(noteIdParam),
    noteControllers.remove
);
router.delete('/:id/notes', verifyDiagramOwnership, noteControllers.clear);
router.put(
    '/notes/:noteId',
    validate(attributesPayload),
    noteControllers.updateById
);

export default router;
