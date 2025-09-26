import { z } from 'zod';

/**
 * Esquemas de validação usando Zod para as requisições da API
 */

// Schema para criação de tarefa
export const createTaskSchema = z.object({
  content: z
    .string()
    .min(1, 'O conteúdo da tarefa não pode estar vazio')
    .max(500, 'O conteúdo da tarefa não pode exceder 500 caracteres')
    .trim(),
  projectId: z
    .string()
    .min(1, 'ID do projeto não pode estar vazio')
    .nullable()
    .optional()
});

// Schema para atualização de tarefa
export const updateTaskSchema = z.object({
  content: z
    .string()
    .min(1, 'O conteúdo da tarefa não pode estar vazio')
    .max(500, 'O conteúdo da tarefa não pode exceder 500 caracteres')
    .trim()
    .optional(),
  completed: z
    .boolean()
    .optional(),
  dueDate: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .transform((val) => val ? new Date(val) : null),
  project: z
    .string()
    .nullable()
    .optional(),
  projectId: z
    .string()
    .nullable()
    .optional(),
  projectColor: z
    .string()
    .nullable()
    .optional()
});

// Schema para parâmetros de rota
export const taskIdSchema = z.object({
  id: z
    .string()
    .min(1, 'ID da tarefa é obrigatório')
});

// Schema para query parameters (futuras funcionalidades)
export const taskQuerySchema = z.object({
  completed: z
    .string()
    .optional()
    .transform((val) => val === 'true' ? true : val === 'false' ? false : undefined),
  tag: z
    .string()
    .optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : undefined)
    .refine((val) => val === undefined || (val > 0 && val <= 100), {
      message: 'Limit deve ser entre 1 e 100'
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : undefined)
    .refine((val) => val === undefined || val >= 0, {
      message: 'Offset deve ser maior ou igual a 0'
    })
});

// Tipos inferidos dos schemas
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskIdInput = z.infer<typeof taskIdSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;

/**
 * Função utilitária para formatar erros de validação do Zod
 * @param error - Erro do Zod
 * @returns Array de erros formatados
 */
export function formatZodError(error: z.ZodError) {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message
  }));
}