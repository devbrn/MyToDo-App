import { Router, Request, Response } from 'express';
import { TagService } from '@/services/tagService';
import { TagRepository } from '@/repositories/tagRepository';
import { getPrismaClient } from '@/config/database';

const router = Router();
const prisma = getPrismaClient();

// Inicializar repositório e serviço
const tagRepository = new TagRepository(prisma);
const tagService = new TagService(tagRepository);

/**
 * GET /api/tags - Lista todas as tags
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tags = await tagService.getAllTags();
    res.json(tags);
  } catch (error) {
    console.error('Erro ao buscar tags:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/tags/:id - Busca uma tag por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'ID da tag é obrigatório' });
    }
    
    const tag = await tagService.getTagById(id);
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }
    
    return res.json(tag);
  } catch (error) {
    console.error('Erro ao buscar tag:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/tags - Cria uma nova tag
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome da tag é obrigatório' });
    }
    
    const tag = await tagService.createTag(name, color);
    return res.status(201).json(tag);
  } catch (error) {
    console.error('Erro ao criar tag:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('já existe')) {
        return res.status(409).json({ error: error.message });
      }
      if (error.message.includes('obrigatório')) {
        return res.status(400).json({ error: error.message });
      }
    }
    
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/tags/:id - Atualiza uma tag
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'ID da tag é obrigatório' });
    }
    
    if (!name) {
      return res.status(400).json({ error: 'Nome da tag é obrigatório' });
    }
    
    const updatedTag = await tagService.updateTag(id, { name, color });
    
    if (!updatedTag) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }
    
    return res.json(updatedTag);
  } catch (error) {
    console.error('Erro ao atualizar tag:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('já existe')) {
        return res.status(409).json({ error: error.message });
      }
      if (error.message.includes('obrigatório')) {
        return res.status(400).json({ error: error.message });
      }
    }
    
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/tags/:id - Remove uma tag
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'ID da tag é obrigatório' });
    }
    
    const result = await tagService.deleteTag(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover tag:', error);
    
    if (error instanceof Error && error.message.includes('não encontrada')) {
      return res.status(404).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;