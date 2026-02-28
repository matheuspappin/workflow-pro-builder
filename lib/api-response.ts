import { NextResponse } from 'next/server';
import { AppError } from './errors';
import logger from './logger';

/**
 * Resposta 400 para parâmetros obrigatórios ausentes.
 */
export function missingParamResponse(param: string) {
  return NextResponse.json({ error: `${param} é obrigatório`, success: false }, { status: 400 })
}

/**
 * Resposta 404 genérica.
 */
export function notFoundResponse(resource = 'Recurso') {
  return NextResponse.json({ error: `${resource} não encontrado`, success: false }, { status: 404 })
}

/**
 * Resposta 403 genérica.
 */
export function forbiddenResponse(message = 'Acesso negado') {
  return NextResponse.json({ error: message, success: false }, { status: 403 })
}

/**
 * Resposta 401 genérica.
 */
export function unauthorizedResponse(message = 'Não autenticado') {
  return NextResponse.json({ error: message, success: false }, { status: 401 })
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string | { message: string; code: string; details?: any };
  [key: string]: any;
}

/**
 * Retorna uma resposta de sucesso padronizada.
 * Para compatibilidade com o frontend atual, os dados são colocados no nível raiz se forem um objeto.
 */
export function successResponse<T>(data: T, status: number = 200) {
  const responseBody: any = {
    success: true,
  };

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    // Espalha as propriedades do objeto no nível raiz
    Object.assign(responseBody, data);
    
    // Também mantém uma cópia em 'data' para compatibilidade com códigos que esperam data.data
    responseBody.data = data;
  } else {
    responseBody.data = data;
  }

  return NextResponse.json(responseBody, { status });
}

/**
 * Retorna uma resposta de erro padronizada.
 */
export function errorResponse(error: Error | AppError, status?: number) {
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'Ocorreu um erro interno no servidor.';
  let details: any = undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorCode = error.errorCode;
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
    if (status) statusCode = status;
  } else if (status) {
    statusCode = status;
  }

  logger.error({
    message: 'API Error',
    errorName: error instanceof Error ? error.name : 'UnknownError',
    errorMessage: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    statusCode,
    errorCode,
    isOperational: error instanceof AppError ? error.isOperational : false,
    requestStatus: status,
  });

  return NextResponse.json({
    success: false,
    error: message,
    code: errorCode,
    details
  }, { status: statusCode });
}
