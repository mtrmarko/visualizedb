import { Router } from 'express';
import {
    create,
    list,
    get,
    restore,
    remove,
} from '../controllers/version.controller';
import { authenticate, verifyDiagramOwnership } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { versionCreateSchema } from '../schemas/version.schema';

const router = Router();

// All version routes require authentication
router.use(authenticate);

// Version operations
router.post(
    '/:diagramId/versions',
    verifyDiagramOwnership,
    validate(versionCreateSchema),
    create
);
router.get('/:diagramId/versions', verifyDiagramOwnership, list);
router.get('/:diagramId/versions/:versionId', verifyDiagramOwnership, get);
router.post(
    '/:diagramId/versions/:versionId/restore',
    verifyDiagramOwnership,
    restore
);
router.delete(
    '/:diagramId/versions/:versionId',
    verifyDiagramOwnership,
    remove
);

export default router;
