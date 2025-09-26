import { useState, useEffect, useCallback } from 'react';
import { api, Tag, CreateTagRequest, UpdateTagRequest } from '@/services/api';

/**
 * Hook para gerenciar tags
 * Fornece funcionalidades para listar, criar, atualizar e remover tags
 */
export const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega todas as tags
   */
  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const tagsData = await api.getTags();
      setTags(tagsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tags';
      setError(errorMessage);
      console.error('Erro ao carregar tags:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cria uma nova tag
   */
  const createTag = useCallback(async (data: CreateTagRequest): Promise<Tag | null> => {
    try {
      setError(null);
      const newTag = await api.createTag(data);
      setTags(prev => [...prev, newTag]);
      return newTag;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar tag';
      setError(errorMessage);
      console.error('Erro ao criar tag:', err);
      return null;
    }
  }, []);

  /**
   * Atualiza uma tag existente
   */
  const updateTag = useCallback(async (id: string, data: UpdateTagRequest): Promise<Tag | null> => {
    try {
      setError(null);
      const updatedTag = await api.updateTag(id, data);
      setTags(prev => prev.map(tag => 
        tag.id === id ? updatedTag : tag
      ));
      return updatedTag;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar tag';
      setError(errorMessage);
      console.error('Erro ao atualizar tag:', err);
      return null;
    }
  }, []);

  /**
   * Remove uma tag
   */
  const deleteTag = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await api.deleteTag(id);
      setTags(prev => prev.filter(tag => tag.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover tag';
      setError(errorMessage);
      console.error('Erro ao remover tag:', err);
      return false;
    }
  }, []);

  /**
   * Busca uma tag por nome
   */
  const findTagByName = useCallback((name: string): Tag | undefined => {
    return tags.find(tag => tag.name === name);
  }, [tags]);

  /**
   * Verifica se uma tag existe
   */
  const tagExists = useCallback((name: string): boolean => {
    return tags.some(tag => tag.name === name);
  }, [tags]);

  /**
   * Busca tags por cor
   */
  const findTagsByColor = useCallback((color: string): Tag[] => {
    return tags.filter(tag => tag.color === color);
  }, [tags]);

  // Carrega tags na inicialização (apenas uma vez)
  useEffect(() => {
    loadTags();
  }, []); // Dependência vazia para executar apenas uma vez

  return {
    tags,
    loading,
    error,
    loadTags,
    createTag,
    updateTag,
    deleteTag,
    findTagByName,
    tagExists,
    findTagsByColor,
  };
};