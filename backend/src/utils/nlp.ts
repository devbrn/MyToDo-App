import { addDays, startOfDay, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { NLPResult } from '@/types';

/**
 * Processador de Linguagem Natural para extrair datas e tags do texto da tarefa
 */
export class NLPProcessor {
  
  /**
   * Processa o conteúdo da tarefa extraindo datas, tags e projetos
   * @param content - Conteúdo da tarefa
   * @returns Resultado do processamento NLP
   */
  static processContent(content: string): NLPResult {
    // Extrair datas primeiro
    const dateResult = this.extractDates(content);
    
    // Extrair projetos do conteúdo limpo
    const projectResult = this.extractProject(dateResult.cleanContent);
    
    // Extrair tags do conteúdo limpo
    const tagResult = this.extractTags(projectResult.cleanContent);
    
    const result = {
      cleanContent: tagResult.cleanContent,
      dueDate: dateResult.dueDate,
      tags: tagResult.tags,
      project: projectResult.project
    };

    return this.isValidResult(result) ? result : { cleanContent: content, dueDate: null, tags: [], project: null };
  }

  /**
   * Extrai datas em linguagem natural do texto
   * @param content - Texto da tarefa
   * @returns Texto limpo e data extraída
   */
  private static extractDates(content: string): { cleanContent: string; dueDate: Date | null } {
    // Usar horário local (meio-dia) para evitar problemas de timezone
    const today = setHours(setMinutes(setSeconds(setMilliseconds(startOfDay(new Date()), 0), 0), 0), 12);
    let cleanContent = content;
    let dueDate: Date | null = null;

    // Primeiro, extrair horários do texto
    const timeResult = this.extractTime(cleanContent);
    cleanContent = timeResult.cleanContent;
    const extractedTime = timeResult.time;

    // Padrões de data em português
    const datePatterns = [
      { pattern: /\bhoje\b/gi, date: today },
      { pattern: /amanhã/gi, date: setHours(setMinutes(setSeconds(setMilliseconds(addDays(today, 1), 0), 0), 0), 12) },
      { pattern: /amanha/gi, date: setHours(setMinutes(setSeconds(setMilliseconds(addDays(today, 1), 0), 0), 0), 12) },
      { pattern: /\bontem\b/gi, date: setHours(setMinutes(setSeconds(setMilliseconds(addDays(today, -1), 0), 0), 0), 12) },
      { pattern: /\besta semana\b/gi, date: setHours(setMinutes(setSeconds(setMilliseconds(addDays(today, 3), 0), 0), 0), 12) },
      { pattern: /\bpróxima semana\b/gi, date: setHours(setMinutes(setSeconds(setMilliseconds(addDays(today, 7), 0), 0), 0), 12) },
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
        break; // Usar apenas a primeira data encontrada
      }
    }

    // Se não encontrou data mas encontrou horário, usar hoje como data base
    if (!dueDate && extractedTime) {
      dueDate = today;
    }

    // Se encontrou horário, aplicar à data
    if (dueDate && extractedTime) {
      dueDate = setHours(setMinutes(dueDate, extractedTime.minutes), extractedTime.hours);
    }
    
    return { cleanContent, dueDate };
  }

  /**
   * Extrai horários do texto em diferentes formatos
   * @param content - Texto da tarefa
   * @returns Texto limpo e horário extraído
   */
  private static extractTime(content: string): { cleanContent: string; time: { hours: number; minutes: number } | null } {
    let cleanContent = content;
    let time: { hours: number; minutes: number } | null = null;

    // Padrões de horário em português
    const timePatterns = [
      // Formato HH:MM (8:00, 14:30, etc.)
      {
        pattern: /\b([0-2]?[0-9]):([0-5][0-9])\b/g,
        extractor: (match: RegExpMatchArray) => {
          const hours = parseInt(match[1] || '0', 10);
          const minutes = parseInt(match[2] || '0', 10);
          return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 
            ? { hours, minutes } 
            : null;
        }
      },
      // Formato HHhMM (8h30, 14h45, etc.)
      {
        pattern: /\b([0-2]?[0-9])h([0-5][0-9])\b/gi,
        extractor: (match: RegExpMatchArray) => {
          const hours = parseInt(match[1] || '0', 10);
          const minutes = parseInt(match[2] || '0', 10);
          return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 
            ? { hours, minutes } 
            : null;
        }
      },
      // Formato HHh00 (8h00, 14h00, etc.)
      {
        pattern: /\b([0-2]?[0-9])h00\b/gi,
        extractor: (match: RegExpMatchArray) => {
          const hours = parseInt(match[1] || '0', 10);
          return hours >= 0 && hours <= 23 
            ? { hours, minutes: 0 } 
            : null;
        }
      },
      // Formato HHh (8h, 14h, etc.)
      {
        pattern: /\b([0-2]?[0-9])h\b/gi,
        extractor: (match: RegExpMatchArray) => {
          const hours = parseInt(match[1] || '0', 10);
          return hours >= 0 && hours <= 23 
            ? { hours, minutes: 0 } 
            : null;
        }
      },
      // Horários por extenso
      {
        pattern: /\b(uma|dois|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|vinte e uma|vinte e dois|vinte e três)\s+horas?\b/gi,
        extractor: (match: RegExpMatchArray) => {
          const hourMap: { [key: string]: number } = {
            'uma': 1, 'dois': 2, 'três': 3, 'quatro': 4, 'cinco': 5, 'seis': 6,
            'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10, 'onze': 11, 'doze': 12,
            'treze': 13, 'quatorze': 14, 'quinze': 15, 'dezesseis': 16, 'dezessete': 17,
            'dezoito': 18, 'dezenove': 19, 'vinte': 20, 'vinte e uma': 21, 'vinte e dois': 22, 'vinte e três': 23
          };
          const hourText = (match[1] || '').toLowerCase();
          const hours = hourMap[hourText];
          return hours !== undefined ? { hours, minutes: 0 } : null;
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
    const cleanContent = content.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();

    return { cleanContent, tags };
  }

  /**
   * Extrai projetos no formato @projeto do texto
   * @param content - Texto da tarefa
   * @returns Texto limpo e projeto extraído
   */
  private static extractProject(content: string): { cleanContent: string; project: string | null } {
    const projectPattern = /@(\w+)/g;
    const match = projectPattern.exec(content);
    
    let project: string | null = null;
    if (match && match[1]) {
      project = match[1].toLowerCase();
    }

    // Remover projeto do conteúdo (apenas o primeiro encontrado)
    const cleanContent = content.replace(/@\w+/, '').replace(/\s+/g, ' ').trim();

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
    
    const nextWeekday = addDays(fromDate, daysToAdd);
    return setHours(setMinutes(setSeconds(setMilliseconds(nextWeekday, 0), 0), 0), 12);
  }

  /**
   * Valida se o conteúdo processado é válido
   * @param result - Resultado do processamento NLP
   * @returns true se válido, false caso contrário
   */
  static isValidResult(result: NLPResult): boolean {
    return result.cleanContent.length > 0;
  }
}