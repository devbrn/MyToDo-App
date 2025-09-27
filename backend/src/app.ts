import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getPrismaClient } from '@/config/database';
import { TaskRepository } from '@/repositories/taskRepository';
import { ProjectRepository } from '@/repositories/projectRepository';
import { TaskService } from '@/services/taskService';
import { TaskController } from '@/controllers/taskController';
import { createTaskRoutes } from '@/routes/taskRoutes';
import projectRoutes from '@/routes/projectRoutes';
import tagRoutes from '@/routes/tagRoutes';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';

/**
 * Cria e configura a aplicação Express
 * @returns Aplicação Express configurada
 */
export function createApp(): express.Application {
  const app = express();

  // Middlewares de segurança e parsing
  app.use(helmet());
  
  // Configuração de CORS mais detalhada para debug
  app.use(cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:3004',
        'http://127.0.0.1:3004',
        'http://localhost:3005',
        'http://127.0.0.1:3005',
        'http://localhost:3006',
        'http://127.0.0.1:3006',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ];
      
      console.log('🔍 [CORS DEBUG] Origin da requisição:', origin);
      
      // Permitir requisições sem origin (ex: Postman, curl)
      if (!origin) {
        console.log('✅ [CORS DEBUG] Requisição sem origin - permitida');
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        console.log('✅ [CORS DEBUG] Origin permitida:', origin);
        callback(null, true);
      } else {
        console.log('❌ [CORS DEBUG] Origin não permitida:', origin);
        callback(new Error('Não permitido pelo CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
  }));
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Middleware de logging para desenvolvimento
  app.use((req, res, next) => {
    console.log(`🚀 [REQUEST] ${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('🔍 [HEADERS] Origin:', req.get('Origin'));
    console.log('🔍 [HEADERS] User-Agent:', req.get('User-Agent'));
    console.log('🔍 [HEADERS] Content-Type:', req.get('Content-Type'));
    
    // Log detalhado para requisições POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      console.log('🔍 [BODY] Type:', typeof req.body);
      console.log('🔍 [BODY] Content:', req.body);
    }
    
    // Log da resposta
    const originalSend = res.send;
    res.send = function(data) {
      console.log(`✅ [RESPONSE] ${req.method} ${req.path} - Status: ${res.statusCode}`);
      return originalSend.call(this, data);
    };
    
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Configurar dependências
  const prisma = getPrismaClient();
  const taskRepository = new TaskRepository(prisma);
  const projectRepository = new ProjectRepository(prisma);
  const taskService = new TaskService(taskRepository, projectRepository);
  const taskController = new TaskController(taskService);

  // Configurar rotas da API
  app.use('/api/tasks', createTaskRoutes(taskController));
  app.use('/api/projects', projectRoutes);
  app.use('/api/tags', tagRoutes);

  // Middleware para rotas não encontradas
  app.use(notFoundHandler);

  // Middleware global de tratamento de erros
  app.use(errorHandler);

  return app;
}