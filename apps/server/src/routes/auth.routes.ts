import { Router } from 'express';
import {
    signup,
    login,
    logout,
    refresh,
    me,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
    signupRequestSchema,
    loginRequestSchema,
} from '../schemas/auth.schema';

const router: Router = Router();

router.post('/signup', validate(signupRequestSchema), signup);
router.post('/login', validate(loginRequestSchema), login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authenticate, me);

export default router;
