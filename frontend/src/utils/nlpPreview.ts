import { addDays, startOfDay, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { NLPPreview } from '@/types';

/**
 * Utilitário para preview do processamento NLP no frontend
 * Replica a lógica do backend para mostrar ao usuário como o texto será processado
 */
export class NLPPreviewProcessor {
  
  /**
   * Processa o conteúdo da tarefa e extrai informações estruturadas
   * @param content - Conteúdo da tarefa
   * @param autoContext - Contexto automático baseado no filtro ativo
   * @returns Preview com informações extraídas
   */
  static processContent(content: string, autoContext?: { 
    selectedFilter?: string; 
    projectName?: string; 
    tagName?: string; 
  }): NLPPreview {
    const originalContent = content.trim();
    let cleanContent = originalContent;
    let dueDate: Date | null = null;
    const tags: string[] = [];
    let project: string | undefined = undefined;

    // Extrair e processar datas em linguagem natural
    const dateResult = NLPPreviewProcessor.extractDates(cleanContent);
    cleanContent = dateResult.cleanContent;
    dueDate = dateResult.dueDate;

    // Extrair tags no formato #palavra
    const tagResult = NLPPreviewProcessor.extractTags(cleanContent);
    cleanContent = tagResult.cleanContent;
    tags.push(...tagResult.tags);

    // Extrair projetos no formato @projeto
    const projectResult = NLPPreviewProcessor.extractProject(cleanContent);
    cleanContent = projectResult.cleanContent;
    project = projectResult.project;

    // Aplicar contexto automático APENAS se não houver informações explícitas
    // REGRA DE PRIORIDADE: Informações explícitas sempre têm prioridade sobre contexto automático
    if (autoContext) {
      // Se não há data especificada explicitamente e o filtro é 'today' ou 'tomorrow', aplicar contexto
      if (!dueDate && autoContext.selectedFilter) {
        if (autoContext.selectedFilter === 'today') {
          dueDate = new Date();
          dueDate.setHours(12, 0, 0, 0); // Meio-dia como padrão
        } else if (autoContext.selectedFilter === 'tomorrow') {
          dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 1);
          dueDate.setHours(12, 0, 0, 0); // Meio-dia como padrão
        }
      }

      // Se não há projeto especificado explicitamente e estamos em um filtro de projeto, aplicar contexto
      if (!project && autoContext.projectName) {
        project = autoContext.projectName;
      }

      // Se não há tag especificada explicitamente e estamos em um filtro de tag, aplicar contexto
      if (tags.length === 0 && autoContext.tagName) {
        tags.push(autoContext.tagName);
      }
    }

    // Verificar se houve mudanças
    const hasChanges = cleanContent !== originalContent || 
                      dueDate !== null || 
                      tags.length > 0 ||
                      project !== undefined;

    return {
      cleanContent: cleanContent.trim(),
      dueDate,
      tags,
      project,
      hasChanges
    };
  }

  /**
   * Extrai datas em linguagem natural do texto
   * @param content - Texto da tarefa
   * @returns Texto limpo e data extraída
   */
  private static extractDates(content: string): { cleanContent: string; dueDate: Date | null } {
    const today = startOfDay(new Date());
    let cleanContent = content;
    let dueDate: Date | null = null;

    // Primeiro, extrair horário se presente
    const timeResult = this.extractTime(cleanContent);
    cleanContent = timeResult.cleanContent;
    const timeInfo = timeResult.time;

    // Padrões de data em português
    const datePatterns = [
      { pattern: /\bhoje\b/gi, date: today },
      { pattern: /amanhã/gi, date: addDays(today, 1) },
      { pattern: /amanha/gi, date: addDays(today, 1) },
      { pattern: /\bontem\b/gi, date: addDays(today, -1) },
      { pattern: /\besta semana\b/gi, date: addDays(today, 3) },
      { pattern: /\bpróxima semana\b/gi, date: addDays(today, 7) },
      { pattern: /\bsegunda\b/gi, date: this.getNextWeekday(today, 1) },
      { pattern: /\bterça\b/gi, date: this.getNextWeekday(today, 2) },
      { pattern: /\bquarta\b/gi, date: this.getNextWeekday(today, 3) },
      { pattern: /\bquinta\b/gi, date: this.getNextWeekday(today, 4) },
      { pattern: /\bsexta\b/gi, date: this.getNextWeekday(today, 5) },
      { pattern: /\bsábado\b/gi, date: this.getNextWeekday(today, 6) },
      { pattern: /\bsabado\b/gi, date: this.getNextWeekday(today, 6) },
      { pattern: /\bdomingo\b/gi, date: this.getNextWeekday(today, 0) }
    ];

    // Procurar por padrões de data (usar o primeiro encontrado)
    for (const { pattern, date } of datePatterns) {
      if (pattern.test(cleanContent)) {
        dueDate = date;
        cleanContent = cleanContent.replace(pattern, '').trim();
        break;
      }
    }

    // Se não encontrou data mas tem horário, usar hoje como base
    if (!dueDate && timeInfo) {
      dueDate = today;
    }

    // Aplicar horário à data se ambos estiverem presentes
    if (dueDate && timeInfo) {
      dueDate = setHours(dueDate, timeInfo.hours);
      dueDate = setMinutes(dueDate, timeInfo.minutes);
      dueDate = setSeconds(dueDate, 0);
      dueDate = setMilliseconds(dueDate, 0);
    } else if (dueDate) {
      // Se só tem data, definir para meio-dia
      dueDate = setHours(dueDate, 12);
      dueDate = setMinutes(dueDate, 0);
      dueDate = setSeconds(dueDate, 0);
      dueDate = setMilliseconds(dueDate, 0);
    }

    return { cleanContent, dueDate };
  }

  /**
   * Extrai horários do texto em diversos formatos
   * @param content - Texto da tarefa
   * @returns Texto limpo e horário extraído
   */
  private static extractTime(content: string): { cleanContent: string; time: { hours: number; minutes: number } | null } {
    let cleanContent = content;
    let time: { hours: number; minutes: number } | null = null;

    // Mapa de horários por extenso
    const hourMap: { [key: string]: number } = {
      'uma': 1, 'duas': 2, 'três': 3, 'tres': 3, 'quatro': 4, 'cinco': 5,
      'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10, 'onze': 11,
      'doze': 12, 'treze': 13, 'catorze': 14, 'quatorze': 14, 'quinze': 15,
      'dezesseis': 16, 'dezasseis': 16, 'dezessete': 17, 'dezassete': 17,
      'dezoito': 18, 'dezenove': 19, 'vinte': 20, 'vinte e uma': 21,
      'vinte e duas': 22, 'vinte e três': 23, 'vinte e tres': 23
    };

    // Padrões de horário
    const timePatterns = [
      // HH:MM (ex: 8:00, 14:30)
      {
        pattern: /\b(\d{1,2}):(\d{2})\b/g,
        extractor: (match: RegExpExecArray) => {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            return { hours, minutes };
          }
          return null;
        }
      },
      // HHhMM (ex: 8h30, 14h45)
      {
        pattern: /\b(\d{1,2})h(\d{2})\b/gi,
        extractor: (match: RegExpExecArray) => {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            return { hours, minutes };
          }
          return null;
        }
      },
      // HHh ou HHh00 (ex: 8h, 14h, 8h00)
      {
        pattern: /\b(\d{1,2})h(?:00)?\b/gi,
        extractor: (match: RegExpExecArray) => {
          const hours = parseInt(match[1]);
          if (hours >= 0 && hours <= 23) {
            return { hours, minutes: 0 };
          }
          return null;
        }
      },
      // Horários por extenso (ex: oito horas, duas horas)
      {
        pattern: /\b(uma|duas|três|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|catorze|quatorze|quinze|dezesseis|dezasseis|dezessete|dezassete|dezoito|dezenove|vinte|vinte e uma|vinte e duas|vinte e três|vinte e tres)\s+horas?\b/gi,
        extractor: (match: RegExpExecArray) => {
          const hourText = match[1].toLowerCase();
          const hours = hourMap[hourText];
          if (hours !== undefined) {
            return { hours, minutes: 0 };
          }
          return null;
        }
      }
    ];

    // Procurar por padrões de horário (usar o primeiro encontrado)
    for (const { pattern, extractor } of timePatterns) {
      const match = pattern.exec(cleanContent);
      if (match) {
        const extractedTime = extractor(match);
        if (extractedTime) {
          time = extractedTime;
          cleanContent = cleanContent.replace(match[0], '').trim();
          break; // Usar apenas o primeiro horário encontrado
        }
      }
    }

    return { cleanContent, time };
  }

  /**
   * Extrai tags no formato #palavra do texto
   * @param content - Texto da tarefa
   * @returns Texto limpo e tags extraídas
   */
  private static extractTags(content: string): { cleanContent: string; tags: string[] } {
    const tagPattern = /#(\w+)/g;
    const tags: string[] = [];
    let match;

    // Extrair todas as tags
    while ((match = tagPattern.exec(content)) !== null) {
      const tagName = match[1]?.toLowerCase();
      if (tagName && !tags.includes(tagName)) {
        tags.push(tagName);
      }
    }

    // Remover tags do conteúdo
    const cleanContent = content.replace(tagPattern, '').trim();

    return { cleanContent, tags };
  }

  /**
   * Extrai projeto no formato @projeto do texto
   * @param content - Texto da tarefa
   * @returns Texto limpo e projeto extraído
   */
  private static extractProject(content: string): { cleanContent: string; project?: string } {
    const projectPattern = /@(\w+)/g;
    const match = projectPattern.exec(content);
    
    let project: string | undefined = undefined;
    if (match && match[1]) {
      project = match[1].toLowerCase();
    }

    // Remover projeto do conteúdo (apenas o primeiro encontrado)
    const cleanContent = content.replace(/@\w+/, '').trim();

    return { cleanContent, project };
  }

  /**
   * Calcula a próxima ocorrência de um dia da semana
   * @param fromDate - Data de referência
   * @param targetDay - Dia da semana (0=domingo, 1=segunda, ..., 6=sábado)
   * @returns Próxima data do dia da semana especificado
   */
  private static getNextWeekday(fromDate: Date, targetDay: number): Date {
    const currentDay = fromDate.getDay();
    let daysToAdd = targetDay - currentDay;
    
    // Se o dia já passou esta semana, ir para a próxima semana
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    return addDays(fromDate, daysToAdd);
  }

  /**
   * Formata a data para exibição amigável
   * @param date - Data a ser formatada
   * @returns String formatada da data
   */
  static formatDatePreview(date: Date): string {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    
    // Verificar se é hoje
    if (startOfDay(date).getTime() === today.getTime()) {
      // Para tarefas de hoje, mostrar horário apenas se não for meio-dia (horário padrão)
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      // Se o horário é meio-dia (12:00), mostrar apenas "hoje"
      if (hours === 12 && minutes === 0) {
        return 'hoje';
      }
      
      // Caso contrário, mostrar "hoje" + horário
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      return `hoje ${timeStr}`;
    }
    
    if (startOfDay(date).getTime() === tomorrow.getTime()) {
      return 'amanhã';
    }
    
    // Formatação para outras datas
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    
    return date.toLocaleDateString('pt-BR', options);
  }

  /**
   * Gera texto de preview mostrando as mudanças que serão aplicadas
   * @param preview - Resultado do processamento NLP
   * @returns Texto descritivo das mudanças
   */
  static generatePreviewText(preview: NLPPreview): string {
    if (!preview.hasChanges) {
      return '';
    }

    const changes: string[] = [];

    if (preview.dueDate) {
      changes.push(`Data: ${this.formatDatePreview(preview.dueDate)}`);
    }

    if (preview.tags.length > 0) {
      changes.push(`Tags: ${preview.tags.map(tag => `#${tag}`).join(', ')}`);
    }

    if (preview.project) {
      changes.push(`Projeto: @${preview.project}`);
    }

    return changes.join(' • ');
  }
}