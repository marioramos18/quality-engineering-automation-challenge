# Quality Engineering Automation Challenge

Automação de API, navegador e Android para aplicações de demonstração, com um desafio opcional de performance contra uma API mock local. Os resultados ficam na aba **Actions** do GitHub: **Quality** executa API e E2E; **Performance** e **Mobile Android POC** são workflows manuais. Cada execução publica os relatórios disponíveis como artifacts.

## Início rápido

Na raiz do repositório, instale **GNU Make**, **Python 3.12**, **uv** e **Docker** com o daemon ativo. `make typecheck` também requer **Node.js e npm** no host; os testes E2E usam o Node.js da imagem Docker. Os testes API/E2E seguros precisam de acesso às aplicações públicas, mas não de credenciais privadas. O teste de performance usa apenas containers locais.

```bash
make help
make test-api
make test-e2e
make typecheck
make test-load-smoke
```

`make test-all` executa API e E2E, mostra os dois códigos de saída e falha se qualquer um falhar. `make test-api-finding` executa separadamente o achado API-001 e preserva seu resultado FAILED. O conjunto padrão E2E executa **somente `@checkout-safe`**; não inclui tentativas de senha incorreta nem finaliza compras.

Os relatórios locais ficam em `reports/api-regression/report.html`, `reports/api-quality-findings/report.html`, `reports/e2e-report.html` e `reports/performance/`; os diagnósticos do catálogo ficam em `reports/catalog-diagnostics/`. Os comandos completos sem Make para [API](#executar-a-api), [E2E](#executar-o-e2e-seguro) e typecheck aparecem abaixo. No GitHub Actions, os jobs usam os comandos do [workflow Quality](.github/workflows/quality.yml) e do [workflow Performance](.github/workflows/performance.yml) e publicam artifacts; o resultado local não substitui o resultado do runner. O E2E no CI permanece bloqueado por HTTP 403 do Cloudflare, e compra concluída e rejeição de cartão inválido continuam fora da cobertura implementada.

## Arquitetura

| Módulo | Tecnologia | Escopo atual |
| --- | --- | --- |
| `api/` | Python 3.12, Pytest, cliente HTTP do Playwright | Contratos e cenários negativos do Restful Booker |
| `web/` | TypeScript, Cucumber.js, Playwright, Page Objects | Carrinho e checkout visitante até Payment; outros cenários ficam fora do CI seguro |
| `mobile/` | Python, Pytest, Appium e Page Objects | Login simulado, navegação e gravação local em SQLite; workflow Android manual |
| `performance/` | Node.js nativo, Docker Compose e k6 | API mock isolada e cenário opcional de 500 VUs por 5 minutos; workflow manual separado |
| `docs/` | Markdown | [Estratégia](docs/test-strategy.md), [achados](docs/findings.md), [investigação do checkout](docs/checkout-investigation.md), [alternativas de e-commerce](docs/ecommerce-alternatives.md) e [resultados de performance](docs/performance-results.md) |

As fixtures em `api/conftest.py` criam dados de reserva e removem as reservas geradas. No navegador, `E2EWorld` e os hooks abrem um contexto novo por cenário; os Page Objects concentram os seletores. O checkout automatizado termina na tela de pagamento, sem acionar `finish`.

## Pré-requisitos

- Para API local: Python 3.12 e [uv](https://docs.astral.sh/uv/).
- Para E2E local: Docker com daemon ativo. A imagem `mcr.microsoft.com/playwright:v1.64.1-noble` está fixada em `web/Dockerfile`; o primeiro build baixa a imagem e instala as dependências de `web/package-lock.json`.
- Para performance: Docker com o plugin `docker compose`. Não é necessário instalar k6 nem Node.js no host; as imagens são baixadas na primeira execução.
- Para mobile: execute o workflow manual no GitHub Actions. O runner instala Java, Node.js, Python, Appium e o SDK Android; não é preciso instalar o SDK no computador local.
- Acesso de rede a `restful-booker.herokuapp.com` e `practicesoftwaretesting.com`. Nenhuma credencial privada é exigida para os comandos seguros.

As versões instaladas pelo lockfile web são Playwright **1.64.1**, Cucumber.js **13.3.0**, TypeScript **7.0.2** e `tsx` **4.23.15**. A API exige Python **3.12**; as demais dependências Python são resolvidas por `uv.lock`. Não é necessário instalar Node.js no host para a execução E2E com Docker.

Os blocos a seguir são as alternativas completas para quem não tem Make. Execute os comandos na raiz do repositório. Para apontar a API para outro ambiente, configure `BOOKER_BASE_URL`; o padrão está em `api/conftest.py`. Para reproduzir `make test-all` sem Make, execute os blocos de API e E2E separadamente e confira o código de saída de cada um.

## Executar a API

```bash
uv sync --locked --dev
uv run --locked ruff check api
mkdir -p reports/api-regression
uv run --locked pytest api/tests -m "not quality_finding" -v \
  --html=reports/api-regression/report.html --self-contained-html \
  --junitxml=reports/api-regression/junit.xml
```

O achado [API-001](docs/findings.md) é executado separadamente para preservar o resultado da assertion original:

```bash
uv sync --locked --dev
mkdir -p reports/api-quality-findings
uv run --locked pytest \
  api/tests/test_required_fields_negative.py::test_post_rejects_missing_firstname -v \
  --html=reports/api-quality-findings/report.html --self-contained-html \
  --junitxml=reports/api-quality-findings/junit.xml
```

Esse comando deve sair com código diferente de zero enquanto a API retornar HTTP 500 para a entrada inválida. O marcador `quality_finding` exclui somente esse teste da regressão principal.

## Executar o E2E seguro

```bash
docker build -t quality-challenge-e2e:local web
mkdir -p reports
docker run --rm --ipc=host \
  --user "$(id -u):$(id -g)" -e HOME=/tmp \
  -v "$PWD/reports:/workspace/reports" \
  quality-challenge-e2e:local \
  npm test -- --tags @checkout-safe
```

A tag `@checkout-safe` inclui carrinho, avanço como visitante até Payment e validação de endereço incompleto. Ela não inclui os cenários de login negativo em contas compartilhadas. Os testes de checkout **não finalizam pedidos**.

Para conferir os tipos TypeScript sem Make ou Docker, execute na raiz do projeto:

```bash
cd web && npm ci --no-audit --no-fund
npx tsc --noEmit
```

### Login negativo em ambiente isolado

Os cenários `@login-negative` **não devem ser executados contra a instância pública**. O hook exige `E2E_ALLOW_NEGATIVE_AUTH=1` **e** `WEB_BASE_URL` apontando para `localhost`, `127.0.0.1` ou `::1`; também bloqueia requisições externas durante esses cenários. A variável sozinha não libera o destino público: a execução falha antes de abrir o navegador. Isso é uma restrição deliberada, não um SKIP ou XFAIL.

Inicie primeiro uma instância Toolshop própria e autorizada, acessível por loopback a partir do processo de teste, com dados isolados e a conta do exemplo presente nessa instância. Depois, com as dependências e o Chromium local instalados, execute em `web/` (substitua `<porta>` pela porta local):

```bash
WEB_BASE_URL=http://127.0.0.1:<porta> \
E2E_ALLOW_NEGATIVE_AUTH=1 \
npm test -- --tags @login-negative
```

Ao executar dentro de Docker, o endereço de loopback precisa apontar para a instância isolada **do ponto de vista do container**; uma variável de ambiente não torna um destino público seguro. Não use esses cenários na instância compartilhada nem no job `E2E Safe`.

## Performance local isolada

O cenário em `performance/load-test.js` usa o executor `constant-vus`: **500 VUs por 5 minutos** no perfil completo. Cada VU faz uma requisição por iteração e pausa por 1 segundo. Aproximadamente 80% das requisições leem itens fixos por `GET /api/items/:id`; 20% criam registros sintéticos em memória por `POST /api/records`. O script verifica status HTTP e campos essenciais do JSON, sem enviar dados pessoais. A API mock e o k6 ficam em uma rede Docker `internal`, sem portas publicadas no host; o teste não acessa Restful Booker, Toolshop ou outro serviço público. Essa escolha usa o [executor `constant-vus` do k6](https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/constant-vus/) e uma [rede interna do Compose](https://docs.docker.com/compose/how-tos/networking/#internal-networks).

Na raiz do projeto, execute o smoke validado; o script inicia a API, aguarda o health check, executa o k6 e remove os containers e a rede inclusive se o teste falhar:

```bash
make test-load-smoke
```

O smoke usa **10 VUs por 15 segundos**. Somente para smoke ou diagnóstico local, é possível ajustar `PERF_VUS` e `PERF_DURATION`, por exemplo: `PERF_VUS=20 PERF_DURATION=30s make test-load-smoke`. O perfil completo ignora essas variáveis e mantém 500 VUs por 5 minutos: `make test-load`. Uma execução local completa está registrada em [resultados de performance](docs/performance-results.md); isso não comprova que o workflow passou no GitHub.

Os resultados ficam em `reports/performance/smoke-summary.json` e `smoke-summary.txt` ou `load-summary.json` e `load-summary.txt`, conforme o perfil. O resumo também aparece no console. O [registro dos resultados](docs/performance-results.md) separa números medidos de hipóteses.

Os thresholds de referência da API mock são taxa de erro HTTP **< 1%**, taxa de erro de contrato **< 1%** e latência HTTP **p95 < 500 ms**. Eles fazem o k6 retornar erro quando falham, mas **não são SLAs reais**. Gerador e API dividem a mesma máquina e recursos de Docker; CPU, memória, disco e agendamento local influenciam a vazão e a latência. O smoke confirma o funcionamento do cenário, não a capacidade de produção nem o resultado esperado para 500 VUs.

## Relatórios e GitHub Actions

Abra `reports/api-regression/report.html`, `reports/api-quality-findings/report.html` ou `reports/e2e-report.html` no navegador depois da execução local. O relatório Cucumber incorpora screenshots de cenários que falham quando a captura é possível; erros de captura são registrados sem substituir a falha original. Logs e JUnit XML também são gerados para os jobs de API. A pasta `reports/` está ignorada pelo Git.

O workflow `.github/workflows/quality.yml` roda em `push` para `main`, `pull_request` e manualmente em `workflow_dispatch`. Na aba **Actions**, abra uma execução e baixe os artifacts `api-tests-reports` (pastas `api-regression/` e `api-quality-findings/`) e `e2e-safe-reports`.

| Job | Execução | Política de falha |
| --- | --- | --- |
| API Tests | Ruff e 22 testes de regressão; etapa diagnóstica separada para `test_post_rejects_missing_firstname` | Ruff e regressão bloqueiam o job; `continue-on-error` vale somente para a etapa diagnóstica. O resumo da execução mostra seu `outcome` original, inclusive `failure` |
| E2E Safe | Imagem Docker existente, somente `@checkout-safe` | Falha bloqueia o job |

Os dois jobs são independentes. Dentro de `API Tests`, o API-001 mantém sua assertion, o código de saída real do Pytest (atualmente FAILED) e relatório próprio. O `continue-on-error` da etapa permite concluir a regressão sem apresentar o achado como teste aprovado; o resultado original é registrado no `GITHUB_STEP_SUMMARY`. Nenhum teste usa XFAIL ou SKIP para esse achado.

### Mobile Android manual no GitHub Actions

Abra **Actions → Mobile Android POC → Run workflow** e escolha a branch com os testes mobile. O workflow usa `ubuntu-24.04`, Android API 35, o APK oficial v2.2.0 com checksum fixado, Appium 3.7.0, UiAutomator2 8.7.0 e as dependências Python do grupo `mobile` em `uv.lock`. Primeiro repete a POC de instalação e abertura do aplicativo; depois inicia o servidor Appium e executa os dois testes Pytest. Não são necessárias credenciais privadas.

O primeiro teste usa `mobile.qa@example.com` e uma senha sintética. O aplicativo valida apenas o formato e exibe um alerta de sucesso **simulado**, sem autenticar em backend. O segundo teste grava um valor único na seção de armazenamento persistido da tela Data Management, compara o valor exibido, reinicia o processo do aplicativo e compara o valor recuperado. Nessa versão, a seção usa SQLite local ao aplicativo; o teste não altera serviços externos.

Ao terminar, baixe o artifact `mobile-android-poc` em **Actions**. Os arquivos são gerados em `reports/mobile/`: `report.html`, `junit.xml`, `pytest.log`, `appium.log`, hierarquias XML das telas, screenshots/XML de falhas e as evidências da POC. A POC #6 confirmou KVM, emulador, instalação do APK e tela Home. **Os dois testes funcionais ainda não foram executados no GitHub**; os locators de Login, Forms e Data Management precisam ser confirmados no artifact da primeira execução. Se falharem, consulte o XML, os screenshots e os logs antes de classificá-los como defeitos do aplicativo.

### Performance manual no GitHub Actions

Na aba **Actions**, selecione **Performance**, clique em **Run workflow**, escolha `smoke` (padrão: 10 VUs por 15 segundos) ou `load` (500 VUs por 5 minutos) e inicie a execução. O workflow não roda em push nem em pull request. Ele usa `ubuntu-24.04`, inicia a mesma API mock e o k6 via Docker Compose, e chama `make test-load-smoke` ou `make test-load`. O script de execução encerra os containers e preserva a falha do k6 ou dos thresholds.

Ao terminar, abra a execução na aba **Actions** para ver o resumo das métricas e baixe o artifact `performance-smoke-reports` ou `performance-load-reports`. Ele contém o JSON e o TXT gerados em `reports/performance/`, quando a execução alcança a geração dos resumos. Se ela falhar antes disso, consulte o log da etapa de execução. Nenhuma credencial privada é necessária; a rede Docker é interna e a carga não é enviada a serviços públicos.

Localmente, k6 e API mock compartilham os recursos da sua máquina; no GitHub, compartilham os recursos do runner. Diferenças de CPU, memória e agendamento podem mudar vazão e latência. O `sleep(1)` também limita a taxa produzida. Resultados do runner devem ser interpretados separadamente dos [resultados locais](docs/performance-results.md); nenhum deles mede capacidade de produção. O workflow ainda não foi executado no GitHub.

## Limitações da execução E2E no GitHub Actions

Na execução local com Docker, os **7 cenários `@checkout-safe` e 41 steps passaram**. No GitHub Actions, os **7 cenários ficaram FAILED** no mesmo ponto, antes da seleção do produto: a navegação para `https://practicesoftwaretesting.com/` recebeu **HTTP 403** do Cloudflare, apresentou a página **"Just a moment..."** de verificação humana e não renderizou produtos.

O artifact `e2e-safe-reports` da execução no GitHub contém o relatório HTML (`e2e-report.html`), o log (`e2e-safe.log`) e os JSONs e screenshots em `catalog-diagnostics/`. Os diagnósticos registram URL, título, status HTTP, contagens de produtos e imagem da página. Essas evidências mostram uma barreira de acesso no runner do CI; os testes não chegaram a exercitar o carrinho ou o checkout. Por isso, a falha **não comprova um defeito funcional** nesses fluxos.

Não adotamos proxies, técnicas de ocultação do navegador nem automação da verificação humana para contornar a proteção anti-bot da aplicação pública. A **execução E2E no GitHub permanece não atendida e o job permanece FAILED**. Uma solução definitiva depende de um ambiente Toolshop autorizado e acessível ao runner do CI. Checkout concluído e rejeição de cartão inválido também permanecem fora da cobertura implementada.

## Limitações e cobertura pendente

Restful Booker e Toolshop são serviços públicos compartilhados; disponibilidade, dados e comportamento podem mudar durante a execução. O [achado API-001](docs/findings.md) registra HTTP 500 ao criar uma reserva sem `firstname`; a classificação contratual permanece em investigação.

**Checkout concluído e rejeição de cartão inválido não foram automatizados.** A conclusão cria uma fatura e pode acionar email e atualização de estoque. Para cobrir esses requisitos, use uma instância local controlada do Toolshop, com dados e caixa de email isolados, conforme a [estratégia de testes](docs/test-strategy.md).

A [comparação de aplicações alternativas](docs/ecommerce-alternatives.md) concluiu por **não migrar agora**: a ShopDemo ainda não tem licença explícita identificada nem execução comprovada no CI; a Maison confirmou pedido local, mas aceitou um cartão inválido e não reproduz o checkout visitante atual. Essa investigação não resolve o bloqueio do Cloudflare no GitHub Actions nem os dois requisitos de checkout pendentes.
