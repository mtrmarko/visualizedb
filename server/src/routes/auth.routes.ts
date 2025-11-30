import { Router } from 'express';
import {
    signup,
    login,
    logout,
    refresh,
    me,
    validateSignup,
    validateLogin,
    validate,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/signup', validateSignup, validate, signup);
router.post('/login', validateLogin, validate, login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authenticate, me);

export default router;
