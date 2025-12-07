import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include parsedId
declare global {
  namespace Express {
    interface Request {
      parsedId?: number;
    }
  }
}

/**
 * Middleware to parse and validate numeric ID from route params
 * @param paramName - The name of the route parameter (default: 'id')
 */
export function parseIdParam(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = parseInt(req.params[paramName]);

    if (isNaN(value)) {
      return res.status(400).json({
        success: false,
        error: `Invalid ${paramName}`,
      });
    }

    req.parsedId = value;
    next();
  };
}
