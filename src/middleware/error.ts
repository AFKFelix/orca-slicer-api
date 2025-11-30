import type { NextFunction, Response, Request } from "express";

export class AppError extends Error {
  status: number = 500;
  causeMessage?: string;

  constructor(status: number, message: string, causeMessage?: string) {
    super(message);
    this.status = status;
    this.causeMessage = causeMessage;
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(
    `[${new Date().toISOString()}] Error: ${err.message} 
    at ${req.method} ${req.originalUrl} with ${err.stack ?? "no stack trace"}
    ${err.causeMessage ? `Cause: ${err.causeMessage}` : ""}`
  );

  const status = typeof err.status === "number" ? err.status : 500;

  res.status(status).json({
    message: err.message,
  });
}
