const { execSync } = require('child_process');

// Cores para o terminal
const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
};

function logInfo(msg) { console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`); }
function logSuccess(msg) { console.log(`${colors.green}[SUCESSO]${colors.reset} ${msg}`); }
function logWarning(msg) { console.log(`${colors.yellow}[AVISO]${colors.reset} ${msg}`); }
function logError(msg) { console.error(`${colors.red}[ERRO]${colors.reset} ${msg}`); }

// Função para executar comandos no terminal
function runCommand(command, ignoreExitCode = false, silent = false) {
  try {
    if (!silent) console.log(`\n${colors.cyan}> ${command}${colors.reset}`);
    const output = execSync(command, { stdio: silent ? 'pipe' : 'inherit', encoding: 'utf-8' });
    return output;
  } catch (error) {
    if (!ignoreExitCode) {
      logError(`Falha ao executar: ${command}`);
      process.exit(1);
    }
    throw error;
  }
}

// 1. Validação de Pré-requisitos
function checkPrerequisites() {
  logInfo("Verificando pré-requisitos...");
  const tools = ['git --version', 'npm --version', 'npx --version', 'npx firebase --version'];
  
  for (const tool of tools) {
    try {
      runCommand(tool, false, true);
    } catch (e) {
      logError(`Ferramenta não encontrada ou falhou: ${tool.split(' ')[0]}`);
      logInfo("Certifique-se de ter o Git, Node.js (npm/npx) e o Firebase CLI instalados.");
      process.exit(1);
    }
  }
  logSuccess("Todos os pré-requisitos estão instalados.");
}

// 2. Configuração do Repositório
function setupGit() {
  logInfo("Verificando configuração do repositório Git...");
  const targetRepo = "https://github.com/0tiagooliveira/painel-de-vendas.git";
  
  try {
    // Verifica se é um repositório git
    runCommand('git rev-parse --is-inside-work-tree', false, true);
  } catch (e) {
    logInfo("Inicializando repositório Git...");
    runCommand('git init');
  }

  try {
    const remotes = runCommand('git remote -v', false, true);
    if (!remotes.includes(targetRepo)) {
      if (remotes.includes('origin')) {
        logInfo("Atualizando URL do remote 'origin'...");
        runCommand(`git remote set-url origin ${targetRepo}`);
      } else {
        logInfo("Adicionando remote 'origin'...");
        runCommand(`git remote add origin ${targetRepo}`);
      }
    }
  } catch (e) {
    logError("Falha ao configurar o repositório remoto.");
    process.exit(1);
  }
  logSuccess("Repositório Git configurado corretamente.");
}

// 3. Pipeline de Build e Controle de Versão
function buildAndCommit() {
  logInfo("Instalando dependências...");
  runCommand('npm install');

  logInfo("Gerando build de produção...");
  runCommand('npm run build');
  logSuccess("Build gerado com sucesso na pasta 'dist'.");

  logInfo("Preparando commit...");
  runCommand('git add .');
  
  try {
    // Verifica se há mudanças para commitar
    const status = runCommand('git status --porcelain', false, true);
    if (status.trim().length > 0) {
      const date = new Date().toLocaleString('pt-BR');
      runCommand(`git commit -m "Deploy automático - ${date}"`);
      logSuccess("Commit realizado.");
    } else {
      logWarning("Nenhuma alteração detectada para commitar.");
    }
  } catch (e) {
    logWarning("Não foi possível realizar o commit (talvez não haja alterações).");
  }

  logInfo("Enviando para o GitHub...");
  try {
    // Tenta pegar a branch atual, se falhar usa main
    let branch = 'main';
    try {
      branch = runCommand('git rev-parse --abbrev-ref HEAD', false, true).trim();
    } catch(e) {}
    
    runCommand(`git push -u origin ${branch}`);
    logSuccess("Código enviado para o GitHub com sucesso.");
  } catch (e) {
    logWarning("Falha ao fazer push para o GitHub. Verifique suas permissões ou se há conflitos.");
    // Não aborta o script aqui para permitir que o deploy no Firebase aconteça
  }
}

// 4. Regras de Deploy no Firebase
function deployFirebase(isFull) {
  const projectId = "painel-de-vendas-c032e";
  
  if (isFull) {
    logInfo("Iniciando Deploy FULL (Hosting + Firestore)...");
    try {
      runCommand(`npx firebase deploy --only hosting,firestore --project ${projectId}`, true);
      logSuccess("Deploy FULL concluído com sucesso!");
    } catch (error) {
      logError("Ocorreu um erro durante o deploy FULL.");
      logWarning("Se o erro for relacionado a permissões do Firestore ou cota, é provável que o seu projeto Firebase não esteja no Plano Blaze (Pay-as-you-go).");
      logWarning("A publicação de regras do Firestore via CLI exige o plano Blaze configurado com um cartão de crédito (mesmo que você não saia da camada gratuita).");
      logInfo("SUGESTÃO: Tente rodar o deploy padrão (apenas Hosting) usando: npm run deploy");
      process.exit(1);
    }
  } else {
    logInfo("Iniciando Deploy PADRÃO (Apenas Hosting)...");
    runCommand(`npx firebase deploy --only hosting --project ${projectId}`);
    logSuccess("Deploy PADRÃO concluído com sucesso!");
  }
}

// Execução Principal
function main() {
  console.log(`${colors.cyan}==========================================${colors.reset}`);
  console.log(`${colors.cyan}   Automação de Deploy - Painel de Vendas ${colors.reset}`);
  console.log(`${colors.cyan}==========================================${colors.reset}\n`);

  const args = process.argv.slice(2);
  const isFull = args.includes('--full') || args.includes('full');

  checkPrerequisites();
  setupGit();
  buildAndCommit();
  deployFirebase(isFull);
  
  console.log(`\n${colors.green}==========================================${colors.reset}`);
  console.log(`${colors.green}   Processo finalizado com sucesso!       ${colors.reset}`);
  console.log(`${colors.green}==========================================${colors.reset}\n`);
}

main();
