export class AppError extends Error {
  statusCode: number;
  errorCode: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, errorCode: string = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true; // Erros operacionais são aqueles que podem ser tratados

    Object.setPrototypeOf(this, AppError.prototype);
  }
}
