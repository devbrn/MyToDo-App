import type { Tag } from '@prisma/client';
import { TagRepository } from '@/repositories/tagRepository';

/**
 * Resposta formatada para tags
 */
export interface TagResponse {
  id: string;
  name: string;
  color: string | null;
  taskCount?: number;
}

/**
 * Serviço de tags contendo a lógica de negócio
 */
export class TagService {
  private tagRepository: TagRepository;

  constructor(tagRepository: TagRepository) {
    this.tagRepository = tagRepository;
  }

  /**
   * Lista todas as tags
   * @param includeTaskCount - Se deve incluir contagem de tarefas
   * @returns Lista de tags formatadas
   */
  async getAllTags(includeTaskCount: boolean = false): Promise<TagResponse[]> {
    const tags = await this.tagRepository.findAll();
    
    const formattedTags: TagResponse[] = [];
    
    for (const tag of tags) {
      const formattedTag: TagResponse = {
        id: tag.id,
        name: tag.name,
        color: tag.color
      };

      if (includeTaskCount) {
        formattedTag.taskCount = await this.tagRepository.countTasks(tag.id);
      }

      formattedTags.push(formattedTag);
    }

    return formattedTags;
  }

  /**
   * Busca uma tag por ID
   * @param id - ID da tag
   * @returns Tag formatada ou null se não encontrada
   */
  async getTagById(id: string): Promise<TagResponse | null> {
    const tag = await this.tagRepository.findById(id);
    
    if (!tag) {
      return null;
    }

    return {
      id: tag.id,
      name: tag.name,
      color: tag.color
    };
  }

  /**
   * Cria uma nova tag
   * @param name - Nome da tag
   * @param color - Cor da tag (opcional)
   * @returns Tag criada
   */
  async createTag(name: string, color?: string): Promise<TagResponse> {
    // Validar nome da tag
    if (!name || name.trim().length === 0) {
      throw new Error('Nome da tag é obrigatório');
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length > 50) {
      throw new Error('Nome da tag deve ter no máximo 50 caracteres');
    }

    // Verificar se já existe uma tag com este nome
    const existingTag = await this.tagRepository.findByName(trimmedName);
    if (existingTag) {
      throw new Error('Já existe uma tag com este nome');
    }

    const tag = await this.tagRepository.create(trimmedName, color);

    return {
      id: tag.id,
      name: tag.name,
      color: tag.color
    };
  }

  /**
   * Atualiza uma tag
   * @param id - ID da tag
   * @param data - Dados para atualização
   * @returns Tag atualizada ou null se não encontrada
   */
  async updateTag(id: string, data: { name?: string; color?: string }): Promise<TagResponse | null> {
    // Validar dados
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Nome da tag é obrigatório');
      }

      const trimmedName = data.name.trim();
      
      if (trimmedName.length > 50) {
        throw new Error('Nome da tag deve ter no máximo 50 caracteres');
      }

      // Verificar se já existe outra tag com este nome
      const existingTag = await this.tagRepository.findByName(trimmedName);
      if (existingTag && existingTag.id !== id) {
        throw new Error('Já existe uma tag com este nome');
      }

      data.name = trimmedName;
    }

    const tag = await this.tagRepository.update(id, data);
    
    if (!tag) {
      return null;
    }

    return {
      id: tag.id,
      name: tag.name,
      color: tag.color
    };
  }

  /**
   * Remove uma tag
   * @param id - ID da tag
   * @returns true se removida, false se não encontrada
   */
  async deleteTag(id: string): Promise<boolean> {
    // Verificar se a tag existe
    const tag = await this.tagRepository.findById(id);
    if (!tag) {
      return false;
    }

    return this.tagRepository.delete(id);
  }

  /**
   * Busca ou cria uma tag pelo nome
   * @param name - Nome da tag
   * @param color - Cor da tag (opcional)
   * @returns Tag encontrada ou criada
   */
  async findOrCreateTag(name: string, color?: string): Promise<TagResponse> {
    if (!name || name.trim().length === 0) {
      throw new Error('Nome da tag é obrigatório');
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length > 50) {
      throw new Error('Nome da tag deve ter no máximo 50 caracteres');
    }

    const tag = await this.tagRepository.findOrCreate(trimmedName, color);

    return {
      id: tag.id,
      name: tag.name,
      color: tag.color
    };
  }
}