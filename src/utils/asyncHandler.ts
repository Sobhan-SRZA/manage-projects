import type {
    Response,
    NextFunction,
    RequestHandler
} from "express";

export const asyncHandler =
    (fn: (req: any, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
        (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };