# Quality Engineering Automation Challenge

## Visão geral e tecnologias

Monorepo de automação para API, navegador, Android e carga. A API e o E2E Web usam serviços públicos de demonstração; o mobile usa um APK de versão fixa em emulador; a carga usa somente uma API mock local. Resultados e limites de cada modalidade estão abaixo.

| Modalidade | Tecnologias | Aplicação |
| --- | --- | --- |
| API | Python 3.12, Pytest, Playwright, Ruff | Restful Booker |
| E2E Web | TypeScript, Cucumber.js, Playwright, Docker | Toolshop |
| Mobile | Python, Pytest, Appium, UiAutomator2 | WebdriverIO Native Demo App v2.2.0 |
| Performance | k6, Node.js, Docker Compose | API mock isolada |

## Início rápido

Instale **Git, GNU Make, Python 3.12, [uv](https://docs.astral.sh/uv/) e Docker com Compose**. Para executar E2E Web e Performance, o Docker Engine deve estar iniciado e o usuário precisa ter permissão para executar comandos Docker. Os comandos API/E2E seguros precisam de acesso às aplicações públicas, mas não de credenciais privadas. O mobile roda no GitHub Actions, sem exigir Android SDK ou emulador no computador local.

```bash
git clone https://github.com/marioramos18/quality-engineering-automation-challenge.git
cd quality-engineering-automation-challenge

make help
make test-api
make test-e2e
make test-load-smoke
```

`make test-all` executa **somente a regressão API e o E2E Web seguro**; não inclui mobile nem performance. O E2E pode falhar em ambientes bloqueados pelo Cloudflare. Use `make typecheck` para TypeScript; esse alvo requer Node.js e npm no host.

## Cobertura e resultados comprovados

| Área | Cobertura e resultado | Evidência |
| --- | --- | --- |
| API | 22 testes de regressão aprovados; o API-001 continua **FAILED** em diagnóstico separado | [Execução Quality](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/39184912545), [achado](docs/findings.md) |
| E2E Web | 7 cenários e 41 passos `@checkout-safe` aprovados localmente; os 7 falharam no GitHub antes do catálogo por HTTP 403 do Cloudflare | [Estratégia e diagnósticos](docs/test-strategy.md), [execução Quality](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/39184912545) |
| Mobile | 2 testes Appium aprovados no GitHub: login simulado com navegação e persistência local após reinício do aplicativo | [Execução manual #7](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/39183629397), [execução automática por push](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/39184912606) |
| Performance | Carga local de 500 VUs por 5 min: 150.000 requisições, 0% de erros e 3 thresholds aprovados. Perfis `smoke` e `load` também concluíram no GitHub | [Resumo local versionado](docs/evidence/k6-load-summary.json), [smoke no GitHub](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/39169917890), [load no GitHub](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/39170697301) |

Na execução mobile manual #7, os dois testes passaram em **86,48 s** e o job levou cerca de **3 min 56 s**. A execução automática por `push` também passou com **2 testes aprovados**. O login do aplicativo é demonstrativo: o sucesso é simulado na interface, sem autenticação em backend. Os valores de performance são da API mock e não representam um benchmark de produção.

## Como executar os testes

| Comando na raiz | O que executa | Resultado esperado |
| --- | --- | --- |
| `make help` | Lista os alvos disponíveis | Mostra comandos e descrições |
| `make test-api` | Sincroniza `uv.lock`, roda Ruff e os 22 testes de regressão; exclui apenas `quality_finding` | Falha se Ruff ou regressão falhar |
| `make test-e2e` | Constrói a imagem `web/Dockerfile` e executa somente `@checkout-safe` | Falha se algum cenário falhar |
| `make test-all` | Executa `test-api` e `test-e2e`, informa ambos os códigos de saída | Falha se qualquer um falhar; não executa mobile nem carga |
| `make test-api-finding` | Executa somente API-001, mantendo a assertion original | Permanece FAILED enquanto a API retornar HTTP 500 |
| `make typecheck` | Instala dependências de `web/package-lock.json` e roda `tsc --noEmit` | Falha em erro de tipos |
| `make test-load-smoke` | API mock local, 10 VUs por 15 s | Falha se k6 ou thresholds falharem |
| `make test-load` | API mock local, 500 VUs por 5 min | Falha se k6 ou thresholds falharem |

Os alvos de carga iniciam e encerram os containers automaticamente; `test-load` leva pelo menos cinco minutos. O conjunto `@checkout-safe` valida carrinho, checkout visitante até Payment e cinco casos de endereço incompleto. Ele não finaliza pedidos nem executa login negativo em conta pública.

Sem Make, os comandos equivalentes mais usados são:

```bash
# Regressão API
uv sync --locked --dev
uv run --locked ruff check api
mkdir -p reports/api-regression
uv run --locked pytest api/tests -m "not quality_finding" -v \
  --html=reports/api-regression/report.html --self-contained-html \
  --junitxml=reports/api-regression/junit.xml

# E2E Web seguro
docker build -t quality-challenge-e2e:local web
mkdir -p reports
docker run --rm --ipc=host --user "$(id -u):$(id -g)" -e HOME=/tmp \
  -v "$PWD/reports:/workspace/reports" quality-challenge-e2e:local \
  npm test -- --tags @checkout-safe
```

Para o achado, use `make test-api-finding` ou o comando no [Makefile](Makefile); para carga, use `bash performance/run-load.sh smoke` ou `bash performance/run-load.sh load`. `BOOKER_BASE_URL` altera o destino da API; o padrão é Restful Booker. A instalação web usa Playwright 1.64.1, Cucumber.js 13.3.0, TypeScript 7.0.2 e `tsx` 4.23.15 fixados em `web/package-lock.json`; a imagem base está em `web/Dockerfile`.

### Login negativo em ambiente isolado

`@login-negative` exige `E2E_ALLOW_NEGATIVE_AUTH=1` **e** `WEB_BASE_URL` apontando para `localhost`, `127.0.0.1` ou `::1`. O hook também bloqueia requisições externas. Use uma instância Toolshop própria, autorizada e com conta de teste isolada; não faça tentativas de senha incorreta na conta pública compartilhada. Depois de instalar as dependências web e o Chromium, execute em `web/`:

```bash
WEB_BASE_URL=http://127.0.0.1:<porta> E2E_ALLOW_NEGATIVE_AUTH=1 \
  npm test -- --tags @login-negative
```

O loopback precisa ser acessível do ponto de vista do processo de teste, inclusive se ele estiver em Docker. Essa restrição falha explicitamente; não usa SKIP ou XFAIL.

## GitHub Actions

Abra a aba **Actions**, escolha o workflow, selecione uma execução e consulte os jobs. Para rodar manualmente, clique em **Run workflow** e escolha a branch; em Performance, selecione também `smoke` ou `load`.

| Workflow | Gatilhos | Jobs ou perfis | Artifact |
| --- | --- | --- | --- |
| [Quality](.github/workflows/quality.yml) | `push` na `main`, `pull_request`, manual | **API Tests** e **E2E Safe** | `api-tests-reports`, `e2e-safe-reports` |
| [Performance](.github/workflows/performance.yml) | Apenas manual | `smoke` (padrão) ou `load` | `performance-smoke-reports` ou `performance-load-reports` |
| [Mobile Android Tests](.github/workflows/mobile.yml) | `push` na `main`, `pull_request` para `main`, manual | **Android Appium tests** | `mobile-android-poc` |

Em Quality, Ruff e regressão API bloqueiam o job. O API-001 roda em etapa diagnóstica com `continue-on-error` somente nela: seu resultado original aparece no `GITHUB_STEP_SUMMARY` e nos relatórios, sem ser apresentado como teste aprovado. O job E2E Safe continua FAILED quando o catálogo público é bloqueado. Mobile instala o APK v2.2.0 com checksum, inicia Android API 35 e executa os testes durante a vida do emulador. Performance usa Docker Compose em rede interna; não envia carga a serviços públicos.

## Relatórios e evidências

O diretório `reports/` é gerado pela execução e ignorado pelo Git. No GitHub, baixe o artifact na página da execução; os uploads usam `if: always()`, então os arquivos já produzidos continuam disponíveis quando um job falha.

| Área | Caminho gerado | Conteúdo |
| --- | --- | --- |
| API regressão | `reports/api-regression/` | `report.html`, `junit.xml`, log no CI |
| API-001 | `reports/api-quality-findings/` | `report.html`, `junit.xml`, log no CI |
| E2E Web | `reports/e2e-report.html`, `reports/e2e-safe.log`, `reports/catalog-diagnostics/` | HTML, log do CI, JSON e PNG dos diagnósticos |
| Mobile | `reports/mobile/` | `report.html`, `junit.xml`, logs Appium/Pytest, screenshots e XML quando gerados |
| Performance | `reports/performance/` | `smoke-summary.json/.txt` ou `load-summary.json/.txt` |

Abra o HTML no navegador e o JUnit XML em um visualizador compatível. Um arquivo que depende de uma etapa não iniciada pode não existir; nesse caso, consulte o log do job. O [resumo da carga local](docs/evidence/k6-load-summary.json) está versionado como evidência permanente.

## Arquitetura do projeto

| Diretório | Responsabilidade |
| --- | --- |
| `api/` | Fixtures Pytest para cliente HTTP, dados e limpeza; testes de contrato e cenários negativos |
| `web/features/`, `web/steps/`, `web/pages/`, `web/support/` | Gherkin, steps, Page Objects, estado e hooks do Cucumber |
| `mobile/pages/`, `mobile/tests/` | Page Objects Android, fixtures Appium e dois testes independentes |
| `performance/` | API mock Node.js, cenário k6 e Compose isolado |
| `.github/workflows/` | Pipelines independentes de Quality, Performance e Mobile |

## Limitações conhecidas

- **E2E Web no GitHub:** o Toolshop público respondeu HTTP 403 com a tela “Just a moment...” do Cloudflare nos sete cenários da execução diagnosticada. Nenhum produto foi renderizado; carrinho e checkout não foram exercitados no runner. Os diagnósticos estão no artifact `e2e-safe-reports`. Isso não comprova defeito funcional. Não contornamos a proteção anti-bot; a execução E2E no GitHub continua não atendida até existir um ambiente autorizado e acessível.
- **Cobertura do checkout:** compra concluída e rejeição de cartão inválido não foram automatizadas. O fluxo implementado termina em Payment, sem clicar em `finish` nem usar cartão real.
- **API pública:** o API-001 registra HTTP 500 para `POST /booking` sem `firstname`; a classificação contratual segue em investigação. Disponibilidade e dados da API pública podem variar.
- **Mobile:** o sucesso do login é simulado; a persistência foi validada apenas na instalação atual após reiniciar o processo. Boot, KVM e downloads podem variar entre runners.
- **Performance:** k6 e API mock compartilham recursos da mesma máquina ou runner. O `sleep(1)` influencia a vazão; os thresholds são critérios de referência da mock, não SLAs nem medição da capacidade máxima de produção.

## Documentação complementar

- [Estratégia de testes, segurança e lacunas](docs/test-strategy.md)
- [Achado API-001](docs/findings.md)
- [Investigação do checkout e locators](docs/checkout-investigation.md)
- [Alternativas locais ao Toolshop](docs/ecommerce-alternatives.md)
- [Viabilidade e resultados mobile](docs/mobile-feasibility.md)
- [Análise dos resultados de performance](docs/performance-results.md)
