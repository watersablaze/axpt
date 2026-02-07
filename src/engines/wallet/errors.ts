export class WalletError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InsufficientFundsError extends WalletError {
  constructor() {
    super('INSUFFICIENT_FUNDS', 'Insufficient funds', 400);
  }
}

export class NotFoundError extends WalletError {
  constructor(message = 'Not found') {
    super('NOT_FOUND', message, 404);
  }
}

export class UnauthorizedError extends WalletError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 403);
  }
}

export class ConflictError extends WalletError {
  constructor(message = 'Conflict') {
    super('CONFLICT', message, 409);
  }
}