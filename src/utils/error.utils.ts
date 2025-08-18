export class WPError extends Error {
  constructor(
    public code: string,
    public override message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'WPError';
  }
}

export class ErrorHandler {
  static handle(error: unknown): WPError {
    const err = error as any;
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


