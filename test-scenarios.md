# Cenários de Teste - Normalização de Nomes de Projetos

## Cenários para testar na aplicação:

### 1. Projetos com espaços
- `@Mariana Sensei` → deve normalizar para `mariana_sensei`
- `@Projeto Pessoal` → deve normalizar para `projeto_pessoal`
- `@Casa Nova` → deve normalizar para `casa_nova`

### 2. Projetos com símbolos
- `@Projeto-Teste` → deve normalizar para `projeto_teste`
- `@App.Mobile` → deve normalizar para `app_mobile`
- `@Site#2024` → deve normalizar para `site_2024`

### 3. Projetos com múltiplos espaços e símbolos
- `@  Projeto   Complexo  ` → deve normalizar para `projeto_complexo`
- `@App-Mobile.2024` → deve normalizar para `app_mobile_2024`
- `@Teste___Final` → deve normalizar para `teste_final`

### 4. Casos extremos
- `@A` → deve normalizar para `a`
- `@123` → deve normalizar para `123`
- `@Ação` → deve normalizar para `acao` (se suportar acentos)

## Como testar:

1. Criar uma tarefa com: "Estudar React @Mariana Sensei"
2. Verificar se o projeto é criado corretamente
3. Tentar criar outra tarefa com: "Revisar código @mariana sensei"
4. Verificar se reconhece como o mesmo projeto
5. Tentar variações como: "@MARIANA SENSEI", "@mariana_sensei"

## Resultados esperados:

- Todos os nomes devem ser normalizados internamente
- O usuário deve ver o nome original na interface
- Projetos similares devem ser reconhecidos como o mesmo
- Não deve haver duplicação de projetos