#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Script de inicialização coordenada para desenvolvimento
 * Inicia o backend primeiro, aguarda ele estar pronto, depois inicia o frontend
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(50)}`, colors.cyan);
  log(`🚀 ${title}`, colors.bright + colors.cyan);
  log(`${'='.repeat(50)}`, colors.cyan);
}

/**
 * Verifica se uma porta está em uso
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => resolve(false));
      server.close();
    });
    
    server.on('error', () => resolve(true));
  });
}

/**
 * Aguarda até que uma URL responda com sucesso
 */
async function waitForServer(url, maxAttempts = 30, interval = 1000) {
  log(`⏳ Aguardando servidor em ${url}...`, colors.yellow);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        log(`✅ Servidor respondendo em ${url}`, colors.green);
        return true;
      }
    } catch (error) {
      // Servidor ainda não está pronto
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
    process.stdout.write('.');
  }
  
  log(`\n❌ Timeout aguardando servidor em ${url}`, colors.red);
  return false;
}

/**
 * Lê a configuração de porta do backend
 */
function getBackendConfig() {
  const configPath = path.join(__dirname, '..', 'port-config.json');
  
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config;
    }
  } catch (error) {
    log(`⚠️ Erro ao ler configuração: ${error.message}`, colors.yellow);
  }
  
  return null;
}

/**
 * Inicia o servidor backend
 */
async function startBackend() {
  logSection('INICIANDO BACKEND');
  
  const backendDir = path.join(__dirname, '..', 'backend');
  
  return new Promise((resolve, reject) => {
    const backend = spawn('npm', ['run', 'dev'], {
      cwd: backendDir,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });

    let serverStarted = false;

    backend.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`[BACKEND] ${output}`);
      
      // Detectar quando o servidor está pronto
      if (output.includes('Servidor rodando na porta') && !serverStarted) {
        serverStarted = true;
        log('✅ Backend iniciado com sucesso!', colors.green);
        resolve(backend);
      }
    });

    backend.stderr.on('data', (data) => {
      process.stderr.write(`[BACKEND ERROR] ${data}`);
    });

    backend.on('error', (error) => {
      log(`❌ Erro ao iniciar backend: ${error.message}`, colors.red);
      reject(error);
    });

    backend.on('exit', (code) => {
      if (code !== 0 && !serverStarted) {
        log(`❌ Backend saiu com código ${code}`, colors.red);
        reject(new Error(`Backend exit code: ${code}`));
      }
    });

    // Timeout de segurança
    setTimeout(() => {
      if (!serverStarted) {
        log('❌ Timeout ao iniciar backend', colors.red);
        backend.kill();
        reject(new Error('Backend startup timeout'));
      }
    }, 30000);
  });
}

/**
 * Inicia o servidor frontend
 */
async function startFrontend(backendConfig) {
  logSection('INICIANDO FRONTEND');
  
  const frontendDir = path.join(__dirname, '..', 'frontend');
  
  // Copiar arquivo de configuração para o frontend
  if (backendConfig) {
    const frontendConfigPath = path.join(frontendDir, 'public', 'port-config.json');
    
    try {
      // Garantir que o diretório public existe
      const publicDir = path.dirname(frontendConfigPath);
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      fs.writeFileSync(frontendConfigPath, JSON.stringify(backendConfig, null, 2));
      log(`📝 Configuração copiada para o frontend`, colors.blue);
    } catch (error) {
      log(`⚠️ Erro ao copiar configuração: ${error.message}`, colors.yellow);
    }
  }
  
  return new Promise((resolve, reject) => {
    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: frontendDir,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });

    let serverStarted = false;

    frontend.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`[FRONTEND] ${output}`);
      
      // Detectar quando o servidor está pronto
      if (output.includes('Local:') && !serverStarted) {
        serverStarted = true;
        log('✅ Frontend iniciado com sucesso!', colors.green);
        resolve(frontend);
      }
    });

    frontend.stderr.on('data', (data) => {
      process.stderr.write(`[FRONTEND ERROR] ${data}`);
    });

    frontend.on('error', (error) => {
      log(`❌ Erro ao iniciar frontend: ${error.message}`, colors.red);
      reject(error);
    });

    frontend.on('exit', (code) => {
      if (code !== 0 && !serverStarted) {
        log(`❌ Frontend saiu com código ${code}`, colors.red);
        reject(new Error(`Frontend exit code: ${code}`));
      }
    });

    // Timeout de segurança (aumentado para 60 segundos)
    setTimeout(() => {
      if (!serverStarted) {
        log('❌ Timeout ao iniciar frontend', colors.red);
        frontend.kill();
        reject(new Error('Frontend startup timeout'));
      }
    }, 60000);
  });
}

/**
 * Função principal
 */
async function main() {
  logSection('MYTODO - INICIALIZAÇÃO DE DESENVOLVIMENTO');
  
  try {
    // 1. Iniciar backend
    const backendProcess = await startBackend();
    
    // 2. Aguardar backend estar pronto e ler configuração
    await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar um pouco
    const backendConfig = getBackendConfig();
    
    if (backendConfig) {
      log(`📡 Backend configurado em: ${backendConfig.baseUrl}`, colors.blue);
      
      // Verificar se o backend está respondendo
      const isReady = await waitForServer(`${backendConfig.baseUrl}/health`);
      if (!isReady) {
        throw new Error('Backend não está respondendo');
      }
    }
    
    // 3. Iniciar frontend
    const frontendProcess = await startFrontend(backendConfig);
    
    // 4. Configurar handlers de shutdown
    const cleanup = () => {
      log('\n🛑 Encerrando servidores...', colors.yellow);
      
      if (backendProcess && !backendProcess.killed) {
        backendProcess.kill('SIGTERM');
      }
      
      if (frontendProcess && !frontendProcess.killed) {
        frontendProcess.kill('SIGTERM');
      }
      
      process.exit(0);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    // 5. Mostrar informações finais
    logSection('SERVIDORES PRONTOS');
    log('🎉 Aplicação iniciada com sucesso!', colors.green);
    
    if (backendConfig) {
      log(`📍 Backend: ${backendConfig.baseUrl}`, colors.blue);
      log(`📍 API: ${backendConfig.baseUrl}/api`, colors.blue);
    }
    
    log('📍 Frontend: Verifique a saída acima para a URL', colors.blue);
    log('\n💡 Pressione Ctrl+C para encerrar ambos os servidores', colors.yellow);
    
  } catch (error) {
    log(`❌ Erro durante inicialização: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log(`❌ Erro fatal: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { main };