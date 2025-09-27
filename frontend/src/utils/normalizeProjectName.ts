/**
 * Normaliza o nome de um projeto para evitar duplicações
 * Remove símbolos, converte para minúsculas, remove acentos e substitui espaços por underscores
 * @param projectName - Nome original do projeto
 * @returns Nome normalizado do projeto
 */
export function normalizeProjectName(projectName: string): string {
  if (!projectName || typeof projectName !== 'string') {
    return '';
  }

  return projectName
    .trim()
    // Normalizar caracteres Unicode (remover acentos)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove símbolos especiais, mantém apenas letras, números, espaços e underscores
    .replace(/[^\w\s]/g, '')
    // Converte para minúsculas
    .toLowerCase()
    // Substitui múltiplos espaços por um único espaço
    .replace(/\s+/g, ' ')
    // Substitui espaços por underscores
    .replace(/\s/g, '_')
    // Remove underscores múltiplos
    .replace(/_+/g, '_')
    // Remove underscores no início e fim
    .replace(/^_+|_+$/g, '');
}