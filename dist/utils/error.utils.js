export class WPError extends Error {
    code;
    message;
    statusCode;
    constructor(code, message, statusCode) {
        super(message);
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
        this.name = 'WPError';
    }
}
export class ErrorHandler {
    static handle(error) {
        const err = error;
        if (err?.response?.status === 401) {
            return new WPError('AUTH_FAILED', 'Authentication failed', 401);
        }
        if (err?.response?.status === 404) {
            return new WPError('NOT_FOUND', 'Resource not found', 404);
        }
        if (err instanceof WPError) {
            return err;
        }
        const message = err?.message || 'Unknown error';
        return new WPError('UNKNOWN', message);
    }
}
