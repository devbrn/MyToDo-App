import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/types';

/**
 * Middleware global para tratamento de erros
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log do erro para debug
  console.error('🚨 Erro capturado:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Determinar código de status baseado no tipo de erro
  let statusCode = 500;
  let message = 'Erro interno do servidor';

  // Erros específicos do Prisma
  if (error.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Erro de validação do banco de dados';
  } else if (error.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Dados inválidos fornecidos';
  } else if (error.name === 'PrismaClientInitializationError') {
    statusCode = 503;
    message = 'Erro de conexão com o banco de dados';
  }

  // Erros de parsing JSON
  if (error.message.includes('Unexpected token') || error.message.includes('JSON')) {
    statusCode = 400;
    message = 'Formato de dados inválido - JSON malformado';
  }

  // Erros de validação customizados
  if (error.message.includes('NLP') || error.message.includes('validação')) {
    statusCode = 400;
    message = error.message;
  }

  const response: ApiResponse<null> = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      details: {
        originalError: error.message,
        stack: error.stack
      }
    })
  };

  res.status(statusCode).json(response);
}

/**
 * Middleware para capturar rotas não encontradas
 */
export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse<null> = {
    success: false,
    error: `Rota ${req.method} ${req.path} não encontrada`
  };

  res.status(404).json(response);
}