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

const router = Router();

// All diagram routes require authentication
router.use(authenticate);

// Config endpoints
router.get('/config', getConfig);
router.put('/config', putConfig);

// Diagram CRUD
router.post('/', create);
router.get('/', list);
router.get('/:id', verifyDiagramOwnership, get);
router.put('/:id', verifyDiagramOwnership, update);
router.delete('/:id', verifyDiagramOwnership, remove);

// Filter endpoints
router.get('/:id/filter', verifyDiagramOwnership, getFilter);
router.put('/:id/filter', verifyDiagramOwnership, putFilter);
router.delete('/:id/filter', verifyDiagramOwnership, deleteFilter);

// Table endpoints
router.get('/:id/tables', verifyDiagramOwnership, tableControllers.list);
router.post('/:id/tables', verifyDiagramOwnership, tableControllers.add);
router.get(
    '/:id/tables/:tableId',
    verifyDiagramOwnership,
    tableControllers.get
);
router.put(
    '/:id/tables/:tableId',
    verifyDiagramOwnership,
    tableControllers.replace
);
router.delete(
    '/:id/tables/:tableId',
    verifyDiagramOwnership,
    tableControllers.remove
);
router.delete('/:id/tables', verifyDiagramOwnership, tableControllers.clear);
router.put('/tables/:tableId', tableControllers.updateById);

// Relationship endpoints
router.get(
    '/:id/relationships',
    verifyDiagramOwnership,
    relationshipControllers.list
);
router.post(
    '/:id/relationships',
    verifyDiagramOwnership,
    relationshipControllers.add
);
router.get(
    '/:id/relationships/:relationshipId',
    verifyDiagramOwnership,
    relationshipControllers.get
);
router.put(
    '/:id/relationships/:relationshipId',
    verifyDiagramOwnership,
    relationshipControllers.replace
);
router.delete(
    '/:id/relationships/:relationshipId',
    verifyDiagramOwnership,
    relationshipControllers.remove
);
router.delete(
    '/:id/relationships',
    verifyDiagramOwnership,
    relationshipControllers.clear
);
router.put(
    '/relationships/:relationshipId',
    relationshipControllers.updateById
);

// Dependency endpoints
router.get(
    '/:id/dependencies',
    verifyDiagramOwnership,
    dependencyControllers.list
);
router.post(
    '/:id/dependencies',
    verifyDiagramOwnership,
    dependencyControllers.add
);
router.get(
    '/:id/dependencies/:dependencyId',
    verifyDiagramOwnership,
    dependencyControllers.get
);
router.put(
    '/:id/dependencies/:dependencyId',
    verifyDiagramOwnership,
    dependencyControllers.replace
);
router.delete(
    '/:id/dependencies/:dependencyId',
    verifyDiagramOwnership,
    dependencyControllers.remove
);
router.delete(
    '/:id/dependencies',
    verifyDiagramOwnership,
    dependencyControllers.clear
);
router.put('/dependencies/:dependencyId', dependencyControllers.updateById);

// Area endpoints
router.get('/:id/areas', verifyDiagramOwnership, areaControllers.list);
router.post('/:id/areas', verifyDiagramOwnership, areaControllers.add);
router.get('/:id/areas/:areaId', verifyDiagramOwnership, areaControllers.get);
router.put(
    '/:id/areas/:areaId',
    verifyDiagramOwnership,
    areaControllers.replace
);
router.delete(
    '/:id/areas/:areaId',
    verifyDiagramOwnership,
    areaControllers.remove
);
router.delete('/:id/areas', verifyDiagramOwnership, areaControllers.clear);
router.put('/areas/:areaId', areaControllers.updateById);

// Custom type endpoints
router.get(
    '/:id/custom-types',
    verifyDiagramOwnership,
    customTypeControllers.list
);
router.post(
    '/:id/custom-types',
    verifyDiagramOwnership,
    customTypeControllers.add
);
router.get(
    '/:id/custom-types/:customTypeId',
    verifyDiagramOwnership,
    customTypeControllers.get
);
router.put(
    '/:id/custom-types/:customTypeId',
    verifyDiagramOwnership,
    customTypeControllers.replace
);
router.delete(
    '/:id/custom-types/:customTypeId',
    verifyDiagramOwnership,
    customTypeControllers.remove
);
router.delete(
    '/:id/custom-types',
    verifyDiagramOwnership,
    customTypeControllers.clear
);
router.put('/custom-types/:customTypeId', customTypeControllers.updateById);

// Note endpoints
router.get('/:id/notes', verifyDiagramOwnership, noteControllers.list);
router.post('/:id/notes', verifyDiagramOwnership, noteControllers.add);
router.get('/:id/notes/:noteId', verifyDiagramOwnership, noteControllers.get);
router.put(
    '/:id/notes/:noteId',
    verifyDiagramOwnership,
    noteControllers.replace
);
router.delete(
    '/:id/notes/:noteId',
    verifyDiagramOwnership,
    noteControllers.remove
);
router.delete('/:id/notes', verifyDiagramOwnership, noteControllers.clear);
router.put('/notes/:noteId', noteControllers.updateById);

export default router;
