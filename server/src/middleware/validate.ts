import type { ZodType } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const validate =
    (schema: ZodType) =>
    (req: Request, res: Response, next: NextFunction): void => {
        const composite = {
            body: req.body,
            query: req.query,
            params: req.params,
        };
        const primary = schema.safeParse(composite);
        const secondary = primary.success
            ? primary
            : schema.safeParse(req.body);

        if (secondary.success) {
            next();
            return;
        }

        const error = secondary.error;
        if (error instanceof ZodError) {
            res.status(400).json({
                error: 'Validation failed',
                details: error.flatten(),
            });
            return;
        }
        next(error);
    };
