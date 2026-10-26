# Roteiro de execução do avaliador

## Preparação

Instale Git, Python 3.12, Docker com Compose v2 e [uv](https://docs.astral.sh/uv/getting-started/installation/). No Linux, Docker Engine deve estar ativo e seu usuário precisa acessar o socket. No macOS e no Windows, inicie o Docker Desktop e selecione containers Linux. Para WSL 2, habilite a integração da distribuição no Docker Desktop.

Clone o repositório e abra o terminal na raiz. Confira `git --version`, `uv --version`, `docker info` e `docker compose version`. Confira também `python3 --version` no Linux/macOS/WSL ou `py -3.12 --version` no PowerShell. Use o Python 3.12 instalado; o uv gerencia o ambiente Python dos testes API. Não é necessário Make. Node/npm no host só são necessários para executar Web fora do runner Docker.

## Executar e consultar resultados

| Objetivo | Linux / macOS / WSL | Windows PowerShell |
| --- | --- | --- |
| API completa isolada | `python3 scripts/run_api.py` | `py -3.12 scripts/run_api.py` |
| Diagnóstico API-001 | `python3 scripts/run_api.py --finding` | `py -3.12 scripts/run_api.py --finding` |
| E2E completo, TypeScript e isolamento | `python3 scripts/run_e2e.py` | `py -3.12 scripts/run_e2e.py` |
| Carga smoke, 10 VUs / 15 s | `python3 scripts/run_load.py smoke` | `py -3.12 scripts/run_load.py smoke` |
| Carga completa, 500 VUs / 5 min | `python3 scripts/run_load.py load` | `py -3.12 scripts/run_load.py load` |

Execute um comando de cada vez. O primeiro download pode consumir minutos e vários GB. API e E2E usam dados privados descartáveis; a carga usa somente a mock local. Os runners aguardam a saúde dos serviços e removem somente os recursos da própria execução.

Abra no navegador os HTML gerados:

- API: `reports/api-regression/report.html`, com JUnit e logs na mesma pasta.
- API-001: `reports/api-quality-findings/report.html`. O comando retorna falha por HTTP 500; consulte a assertion para distinguir o achado de erro de instalação.
- E2E: `reports/e2e-isolated/e2e-report.html`, com screenshots, JUnit e logs na mesma pasta.
- Carga: resumos JSON e TXT em `reports/performance/`.
- Mobile: GitHub Actions → Mobile Android Tests → execução → artifact `mobile-android-poc`; abra `reports/mobile/report.html` após extrair. As dependências locais específicas estão em [mobile-feasibility.md](mobile-feasibility.md).

Em erro, preserve o log e o relatório. Não trate ausência de JUnit como teste aprovado. Não execute duas sessões escrevendo no mesmo diretório de relatórios. Encerramento forçado pode impedir a limpeza; identifique o projeto `quality-api-*`, `quality-e2e-*` ou `quality-load-*` da execução antes de remover seus recursos.

## Outro ambiente sem alterar código

API: crie `.env` a partir de `.env.example` e configure URL e credenciais do destino autorizado. Os seguintes comandos são iguais em Bash e PowerShell:

```text
uv sync --locked --dev
uv run --locked --env-file .env pytest api/tests -m "not quality_finding and not isolated_auth" -v --html=reports/api-external/report.html --self-contained-html --junitxml=reports/api-external/junit.xml
```

Esse subconjunto foi validado no serviço público com 16 testes; os seis negativos de autenticação/autorização e o diagnóstico são desmarcados intencionalmente, não ignorados por skip. A regressão completa de 22 testes permanece no runner privado. A proteção bloqueia negativos de autenticação fora de loopback, mesmo com opt-in. Não versione `.env` privado.

Web: configure `WEB_BASE_URL`, `E2E_CUSTOMER_EMAIL` e `E2E_CUSTOMER_PASSWORD` antes do Cucumber. Bash usa `export NOME=valor`; PowerShell usa `$env:NOME="valor"`. Instale Node/npm compatíveis com `web/package-lock.json` e execute:

```text
cd web
npm ci --no-audit --no-fund
npx playwright install chromium
npm test -- --tags "@checkout-safe or @login or @account-navigation or @login-validation"
```

Use somente instância Toolshop compatível e conta autorizada. Os Page Objects recebem configuração; não se altera código para trocar a origem. Negativos e pedidos devem usar o runner privado, que não reaproveita URLs externas para limpeza de dados.

## Diagnóstico e limites de plataforma

O erro `dockerDesktopLinuxEngine ... The system cannot find the file specified` indica que o Engine Linux não está acessível. Abra o Docker Desktop, aguarde a inicialização, confirme containers Linux e consulte `docker context ls`. No WSL, confira a integração; no Linux, confira o serviço e acesso ao socket. Repita `docker info` antes dos testes.

As execuções completas foram comprovadas em Linux. A documentação e os scripts oferecem comandos para os demais sistemas; a nova configuração CI verifica proteções Python e entrypoints em Windows/macOS, sem comprovar Docker Desktop ou E2E nesses hosts. A API fixa imagem `linux/amd64`; Apple Silicon depende de emulação e ainda não tem validação funcional. Não se afirma sucesso em plataformas não executadas.
