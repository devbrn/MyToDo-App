/**
 * Configuração padrão de portas para o frontend
 */
export const DEFAULT_CONFIG = {
  BACKEND_PORT: 3001,
  FRONTEND_PORT: 3004,
  FALLBACK_API_URL: 'http://localhost:3001/api'
} as const;

/**
 * Interface para configuração de portas
 */
interface PortConfig {
  backend: number;
  timestamp: string;
  baseUrl: string;
}

/**
 * Lê a configuração de portas do arquivo gerado pelo backend
 * @returns Promise<string> - URL base da API
 */
export async function getApiBaseUrl(): Promise<string> {
  try {
    // Tentar ler o arquivo de configuração de portas
    const response = await fetch('/port-config.json');
    
    if (response.ok) {
      const config: PortConfig = await response.json();
      const apiUrl = `${config.baseUrl}/api`;
      
      console.log(`📡 Usando configuração dinâmica de porta: ${apiUrl}`);
      return apiUrl;
    }
  } catch (error) {
    console.warn('⚠️ Não foi possível ler configuração dinâmica de porta:', error);
  }
  
  // Fallback para configuração de ambiente ou padrão
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    console.log(`📡 Usando configuração de ambiente: ${envApiUrl}`);
    return envApiUrl;
  }
  
  console.log(`📡 Usando configuração padrão: ${DEFAULT_CONFIG.FALLBACK_API_URL}`);
  return DEFAULT_CONFIG.FALLBACK_API_URL;
}

/**
 * Testa conectividade com a API
 * @param baseUrl - URL base da API
 * @returns Promise<boolean> - true se a API estiver acessível
 */
export async function testApiConnectivity(baseUrl: string): Promise<boolean> {
  try {
    const healthUrl = baseUrl.replace('/api', '/health');
    console.log(`🔍 Testando conectividade com: ${healthUrl}`);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    const isOk = response.ok;
    console.log(`${isOk ? '✅' : '❌'} Teste de conectividade ${healthUrl}: ${response.status}`);
    return isOk;
  } catch (error) {
    console.warn(`⚠️ Falha ao testar conectividade com ${baseUrl}:`, error);
    return false;
  }
}

/**
 * Encontra uma URL de API funcional testando múltiplas opções
 * @returns Promise<string> - URL da API funcional
 */
export async function findWorkingApiUrl(): Promise<string> {
  const candidates = [
    'http://localhost:3002/api', // Priorizar porta 3002 onde o backend correto está rodando
    await getApiBaseUrl(),
    DEFAULT_CONFIG.FALLBACK_API_URL,
    'http://localhost:3003/api'
  ];
  
  // Remover duplicatas
  const uniqueCandidates = [...new Set(candidates)];
  
  for (const url of uniqueCandidates) {
    console.log(`🔍 Testando conectividade com: ${url}`);
    
    const isWorking = await testApiConnectivity(url);
    if (isWorking) {
      console.log(`✅ API funcional encontrada: ${url}`);
      return url;
    }
  }
  
  console.error('❌ Nenhuma API funcional encontrada. Usando fallback.');
  return DEFAULT_CONFIG.FALLBACK_API_URL;
}