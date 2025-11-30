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
} from '../controllers/diagram.controller';
import { authenticate, verifyDiagramOwnership } from '../middleware/auth';

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

export default router;
