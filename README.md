# Quality Engineering Automation Challenge

Monorepo do desafio de automação: API, E2E Web, Android e carga. O E2E completo executa em uma instância **privada e descartável** do Toolshop, com imagens fixadas por digest, banco próprio e dados demonstrativos. Não depende do acesso à aplicação pública nem realiza pagamentos reais.

A [revisão de aderência ao desafio e ao feedback](docs/feedback-alignment.md) relaciona as solicitações dos avaliadores às implementações, evidências e pendências. O [roteiro do avaliador](docs/evaluator-guide.md) reúne os comandos por sistema e a localização dos relatórios.

## Tecnologias e arquitetura

| Área | Ferramentas e versões | Aplicação |
| --- | --- | --- |
| API | Python 3.12, Pytest 9.1.1, pytest-playwright 0.10.0 | Restful Booker privado e descartável; subconjunto seguro em outro destino |
| E2E | TypeScript 7.0.2, Cucumber.js 13.3.0, Playwright 1.64.1 | Toolshop Sprint 5 isolado |
| Mobile | Appium 3.7.0, UiAutomator2 8.7.0, Python 3.12 | WebdriverIO Native Demo App 2.2.0, Android API 35 |
| Carga | k6 1.5.0, Node.js, Docker Compose | Mock local em rede interna |
| CI | GitHub Actions | Quality, Mobile Android Tests, Performance |

`uv.lock` e `web/package-lock.json` fixam as dependências. As imagens do Toolshop, MariaDB e Nginx estão fixadas por digest em `web/isolated/compose.yaml`.

```text
api/                     Fixtures, contratos HTTP, proteção e Compose isolado
web/features/            Cenários Gherkin de negócio
web/steps/               Orquestração e assertivas
web/pages/               Locators e interações de interface
web/support/             Configuração, dados, World, hooks, auditoria e diagnósticos
web/tests/               Testes das restrições de isolamento
web/isolated/            Compose privado e proxy da API
mobile/pages/, tests/    Page Objects Android, fixtures e testes Appium
performance/             Mock e cenário k6
scripts/                 Comandos Python portáteis de API, E2E e carga
.github/workflows/       Pipelines e publicação de evidências
docs/                    Estratégia, achados, resultados e pendências
```

Os Page Objects mantêm locators como propriedades e concentram ações da interface. Os steps contêm as assertivas de negócio; rotas e leitura das respostas HTTP do checkout ficam em `web/support/`. Configuração, credenciais, dados sintéticos, auditoria de pedidos e escrita de diagnósticos ficam separados. Cada cenário cria seu próprio contexto de navegador; não há sleeps fixos nem retries de cenários.

## Instalação e início rápido

A versão de entrega está na branch padrão `main`. Não é necessário selecionar outra branch. Faça o clone e abra um terminal na raiz:

```text
git clone https://github.com/marioramos18/quality-engineering-automation-challenge.git
cd quality-engineering-automation-challenge
```

Instale Git e Python 3.12. Para as suítes completas de API/E2E e para carga, instale Docker com Compose v2. Para API, instale também [uv](https://docs.astral.sh/uv/getting-started/installation/). Não é necessário Node no host para o E2E em Docker. O primeiro download das imagens pode demorar vários minutos e consumir alguns GB.

### Avaliador no Windows PowerShell

Instale Python 3.12 e Docker Desktop com Compose v2. Inicie o Docker Desktop em modo de containers Linux e, na raiz do projeto, confira os pré-requisitos antes do E2E:

```powershell
py -3.12 --version
docker info
docker compose version
py -3.12 scripts/run_e2e.py
```

Se `docker info` mostrar `dockerDesktopLinuxEngine ... The system cannot find the file specified`, o Engine Linux ainda não está acessível. Aguarde o Docker Desktop iniciar, confira o modo de containers Linux e o contexto em `docker context ls`; repita `docker info` antes de executar o E2E. O comando Python executa a instalação privada, o typecheck, os testes e a geração do relatório em `reports/e2e-isolated/`. A execução funcional em Windows ainda precisa ser validada nesse sistema.

| Sistema | Preparação | E2E completo | Carga smoke |
| --- | --- | --- | --- |
| Linux | Docker Engine ativo e acesso ao socket | `python3 scripts/run_e2e.py` | `python3 scripts/run_load.py smoke` |
| macOS | Docker Desktop iniciado, containers Linux | `python3 scripts/run_e2e.py` | `python3 scripts/run_load.py smoke` |
| Windows PowerShell | Docker Desktop iniciado, containers Linux; Python Launcher | `py -3.12 scripts/run_e2e.py` | `py -3.12 scripts/run_load.py smoke` |
| Windows WSL 2 | Docker Desktop com integração da distribuição | `python3 scripts/run_e2e.py` | `python3 scripts/run_load.py smoke` |

Os scripts usam a biblioteca padrão do Python e listas de argumentos, sem depender de Bash, Make ou sintaxe de variável do shell. **Execução funcional local validada em Linux. macOS, Windows e Apple Silicon ainda precisam de validação funcional nos respectivos sistemas**; a disponibilidade de arquitetura das imagens de terceiros também pode limitar esses ambientes.

Antes de executar, confirme:

```text
docker info
docker compose version
```

Se ocorrer `dockerDesktopLinuxEngine ... The system cannot find the file specified`, o Engine Linux não está acessível: abra o Docker Desktop, aguarde iniciar, confira o modo Linux e o contexto em `docker context ls`. No WSL, habilite a integração da distribuição. No Linux, verifique o serviço e as permissões do socket. Os scripts encerram com diagnóstico antes dos testes se o Docker não estiver disponível.

### E2E completo e seguro

```text
python3 scripts/run_e2e.py
```

No PowerShell, substitua `python3` por `py -3.12`. O comando:

1. Constrói a imagem de testes com o lockfile.
2. Cria um projeto Compose com nome único, sem publicar portas no host.
3. Aguarda banco e interface; executa migrations e seed somente no banco recém-criado.
4. Verifica TypeScript e as restrições de isolamento.
5. Executa todos os cenários, incluindo login negativo e checkout completo.
6. Salva relatórios/logs e remove containers, rede e volume da aplicação, inclusive em falha normal.

A rede é interna. Navegador, interface e listener HTTP da API compartilham loopback, preservando a URL de desenvolvimento da aplicação e o bloqueio de requisições externas nos cenários sensíveis. A instalação é privada e temporária; nenhum código do Toolshop é incorporado a este repositório. Uso conforme a [licença do titular](https://github.com/testsmith-io/practice-software-testing/blob/main/LICENSE), para finalidade privada, interna e não comercial.

Para selecionar cenários, sem alterar o código:

```text
python3 scripts/run_e2e.py --tags @isolated-checkout
python3 scripts/run_e2e.py --tags @login-negative
```

Não execute duas sessões simultâneas gravando na mesma pasta de relatórios. Uma interrupção forçada do processo ou encerramento do Docker pode impedir o cleanup; identifique o projeto `quality-e2e-*` da execução com `docker compose ls` e remova somente seus recursos.

### API

Execute a regressão completa em ambiente privado. O runner instala as dependências bloqueadas, verifica Ruff, inicia um container descartável com porta aleatória somente em `127.0.0.1`, aguarda a saúde da API e executa os testes. O container e sua rede são removidos ao terminar. Nenhum dado do serviço público é usado.

```text
python3 scripts/run_api.py
```

No Windows PowerShell: `py -3.12 scripts/run_api.py`. No Linux/macOS, confirme que o Python selecionado é o instalado; o ambiente dos testes é Python 3.12, gerenciado pelo uv. As credenciais demonstrativas da imagem ficam em `api/isolated/credentials.env`, fora dos testes e do runner. Credenciais privadas herdadas do host são descartadas nesse modo. A imagem do autor é fixada por digest e usa `linux/amd64`; Apple Silicon depende de emulação do Docker Desktop e ainda não foi validado.

Os contratos negativos revisados verificam status, media type e corpo em 11 casos. [Fontes, validação local e limites](docs/api-error-contracts.md).

O achado conhecido é executado separadamente, preservando a falha:

```text
python3 scripts/run_api.py --finding
```

No PowerShell: `py -3.12 scripts/run_api.py --finding`. O retorno não zero preserva o achado; não significa falha de instalação. Relatórios HTML/JUnit, log Pytest, log do serviço e identificação do ambiente ficam em `reports/api-regression/` ou `reports/api-quality-findings/`. Abra `report.html` no navegador. Não execute duas sessões na mesma pasta de relatórios. Em encerramento forçado, identifique somente o projeto `quality-api-*` dessa execução antes de remover seus recursos.

Python foi escolhido pela clareza dos testes, fixtures e parametrização do Pytest, preparação/limpeza de reservas e relatórios HTML/JUnit. O cliente HTTP do Playwright dispensa navegador. A linguagem também é utilizada no mobile. O trade-off é manter os ecossistemas Python e TypeScript, cada um com seu lockfile.

### Configuração por ambiente

| Modalidade | Variáveis | Onde configurar |
| --- | --- | --- |
| API externo | `BOOKER_BASE_URL`, `BOOKER_USERNAME`, `BOOKER_PASSWORD` | `.env` privado ou secrets do CI |
| API negativo de autenticação | `BOOKER_ALLOW_NEGATIVE_AUTH=1` e destino loopback descartável | Runner privado configura automaticamente |
| Web externo | `WEB_BASE_URL`, `E2E_CUSTOMER_EMAIL`, `E2E_CUSTOMER_PASSWORD` | Ambiente do processo Cucumber |
| Checkout isolado | `E2E_ALLOW_ORDER_CREATION`, `E2E_API_BASE_URL`, `E2E_AUDIT_EMAIL`, `E2E_AUDIT_PASSWORD` | Compose privado já configurado |
| Login negativo | `E2E_ALLOW_NEGATIVE_AUTH=1` e destino loopback | Compose privado já configurado |
| Evidências Web | `E2E_REPORT_DIR`, `E2E_CAPTURE_SUCCESS` | Processo Cucumber; definidos no Compose |

A API lê credenciais do ambiente. `.env.example` contém somente a conta pública demonstrativa. Para outro destino compatível autorizado, copie o exemplo para `.env` e altere as três variáveis. Não registre segredos privados no Git. Execute o subconjunto seguro com os mesmos testes, sem autenticação negativa:

```text
uv sync --locked --dev
uv run --locked --env-file .env pytest api/tests -m "not quality_finding and not isolated_auth" -v --html=reports/api-external/report.html --self-contained-html --junitxml=reports/api-external/junit.xml
```

Esse comando é igual em Bash e PowerShell. O marcador seleciona explicitamente o subconjunto compatível; não há skips para ocultar falhas. A regressão completa continua obrigatória no runner privado. Selecionar autenticação negativa sem opt-in e loopback encerra a coleta com erro antes das requisições. Redirects HTTP são desativados. Somente reservas criadas pelo próprio teste são atualizadas/removidas.

O executor isolado é intencionalmente fixado em seu próprio ambiente; não reaproveita uma URL externa para apagar dados. Para executar apenas os cenários seguros em outro ambiente compatível, instale Node/npm e Chromium:

```text
cd web
npm ci --no-audit --no-fund
npx playwright install chromium
npm test -- --tags "@checkout-safe or @login-validation"
```

Defina `WEB_BASE_URL` **antes** do comando: Bash usa `export WEB_BASE_URL=...`; PowerShell usa `$env:WEB_BASE_URL="..."`. Para executar `@login` e `@account-navigation` em uma instância própria autorizada, informe também `E2E_CUSTOMER_EMAIL` e `E2E_CUSTOMER_PASSWORD`. O fallback público é usado apenas quando nenhuma credencial foi informada e a URL é exatamente a demonstração pública. O mesmo código utiliza rotas e locators da versão compatível do Toolshop.

Nunca execute autenticação negativa ou criação de pedido no serviço público. Os hooks exigem opt-in e loopback e bloqueiam destinos externos. A auditoria de pedidos usa uma conta administrativa demonstrativa somente na instalação descartável; não altera pedidos pela API.

Na [validação de uma segunda origem Web](docs/evidence/web-second-origin.md), o mesmo código aprovou 10 cenários seguros no serviço público. Os dois cenários de login positivo falharam porque a conta pública compartilhada estava bloqueada; não foram repetidos. A suíte completa continua comprovada na instância privada.

### Carga

```text
python3 scripts/run_load.py smoke
python3 scripts/run_load.py load
```

O perfil completo fixa **500 VUs por 5 minutos**. O mock fica em rede interna; não é possível redirecionar a carga para uma API pública por variável de URL. Os resultados representam essa mock local, não a capacidade de produção. [Análise e limitações](docs/performance-results.md).

### Mobile

O caminho reproduzível atual é o workflow **Mobile Android Tests**: Actions → workflow → Run workflow. Ele prepara Java, Android API 35, KVM, APK com checksum, Appium e UiAutomator2, executa os dois testes e publica HTML/JUnit/logs. Nesta revisão, roda em push em qualquer branch e PR para `main`.

O login é simulado pelo aplicativo. O segundo teste salva um valor em Data Management e o recupera após reiniciar o processo. Não há autenticação nem envio a backend. A execução local exige Android SDK, dispositivo/emulador, APK e Appium configurados; não está incluída nos comandos E2E. [Detalhes mobile](docs/mobile-feasibility.md).

## Resultados e evidências

| Área | Resultado local verificado | Relatório |
| --- | --- | --- |
| API regressão | 22 aprovados, 0 falhas, 0 ignorados | `reports/api-regression/` |
| Proteções da API e runner | 13 aprovados, 0 falhas, 0 ignorados | `reports/api-guards/` |
| API em outro destino | 16 aprovados no público; 7 desmarcados pela seleção segura | `reports/api-external/` |
| API-001 | 1 falha: HTTP 500 ao omitir `firstname` | `reports/api-quality-findings/` |
| Web isolado | 17 cenários e 103 passos aprovados; 4 testes de isolamento e typecheck aprovados | `reports/e2e-isolated/` |
| Web público seguro | 10 cenários e 57 passos aprovados; login positivo público não comprovado | `reports/e2e-public-safe/` |
| Carga completa | 500 VUs, 5 min, 150.000 requisições, 0% erros, 3 thresholds aprovados | `reports/performance/` |
| Mobile | 2 aprovados no PR #2; host local sem Android SDK/KVM | `reports/mobile/` no artifact |

API, E2E, mobile e proteções Python Windows/macOS passaram no GitHub Actions para o commit `3ad8224`: [resultados, tempos e artifacts](docs/evidence/ci-validation.md). O API-001 permanece FAILED no diagnóstico separado.

A [validação local anterior](docs/evidence/local-validation.md) registra a API privada, o segundo destino da API, o E2E e o smoke de carga. A [verificação Web em duas origens](docs/evidence/web-second-origin.md) identifica separadamente o código `c35066b` e os resultados locais. A evidência remota de CI acima se refere ao código `3ad8224`; não comprova automaticamente commits posteriores.

O HTML E2E inclui screenshots dos cenários e, na compra, o identificador e os valores do pedido consultado. Também são gerados JUnit, `cucumber.log`, `services.log` e JSON/PNG de diagnóstico em falhas. `reports/` é ignorado pelo Git; os artifacts do CI preservam os resultados da execução. A [matriz de cobertura e pendências](docs/test-strategy.md) distingue resultado local, histórico remoto e itens ainda não comprovados.

## CI e facilitadores

### Como executar cada suíte

Na raiz do projeto, escolha a suíte. Os comandos `make` exigem GNU Make; API, E2E e carga exigem Python 3.12, Docker com containers Linux e Compose v2. A API também usa `uv`. No Windows PowerShell, instale GNU Make e acrescente `PYTHON="py -3.12"` ao comando, por exemplo `make PYTHON="py -3.12" test-regression`. A execução funcional em Windows ainda não foi validada.

| Suíte | Comando local | GitHub Actions |
| --- | --- | --- |
| API regressão | `make test-api` | **Quality** → **Run workflow**; executa API junto com E2E |
| E2E Web, typecheck e testes de isolamento | `make test-e2e` | **Quality** → **Run workflow**; executa E2E junto com API |
| API + E2E | `make test-regression` | **Quality** → **Run workflow** |
| Achado API-001 | `make test-api-finding` | Etapa diagnóstica de **Quality**; a falha é esperada e registrada |
| Carga smoke, 10 VUs por 15 s | `make test-load-smoke` | **Performance** → **Run workflow** → perfil `smoke` |
| Carga completa, 500 VUs por 5 min | `make test-load` | **Performance** → **Run workflow** → perfil `load` |
| Mobile Android | `make test-mobile` | **Mobile Android Tests** → **Run workflow** |
| API + E2E + ambas as cargas + mobile | `make test-all` | Execute **Quality**, **Performance** nos dois perfis e **Mobile Android Tests**; não há workflow único |

Para executar no GitHub, abra a aba **Actions** do repositório, escolha o workflow indicado e clique em **Run workflow**. **Quality** e **Mobile Android Tests** também iniciam automaticamente em push; **Performance** é manual. A execução manual exige permissão de escrita no repositório. Sem essa permissão, o avaliador pode consultar os resultados e artifacts das execuções existentes ou executar os workflows em um fork com Actions habilitado.

O workflow **Mobile Android Tests** prepara Android API 35, emulador, `adb`, Appium, UiAutomator2 e o APK com checksum; esses itens não precisam estar instalados no computador do avaliador para usar o GitHub Actions. Localmente, `make test-mobile` exige Linux/WSL com emulador ativo, Android SDK, Appium/UiAutomator2, `uv` e `APK_PATH` para o APK verificado. `make test-all` verifica os pré-requisitos básicos do mobile antes de iniciar qualquer suíte e falha com diagnóstico se faltarem. O diagnóstico API-001 permanece fora de `make test-all`, pois retorna falha conhecida por definição.

Uploads usam `if: always()`. O API-001 continua não bloqueante apenas na etapa diagnóstica com `continue-on-error`, mas seu resultado original é registrado; não integra os 22 testes aprovados. Regressão API e E2E são bloqueantes. O histórico de Cloudflare no serviço público permanece documentado, mas o novo job E2E utiliza a instância privada.

`make typecheck` valida TypeScript separadamente e requer Node/npm no host. `make help` lista os targets. `make test-regression` informa os resultados de API e E2E mesmo se uma das suítes falhar. Os comandos Python diretos das seções anteriores continuam disponíveis sem GNU Make.

## Limites e documentação

- O cartão `0000-0000-0000-0000` é sintético. O cenário positivo prova aceitação pelo demonstrativo e persistência do pedido; o negativo prova rejeição de formato, sem autorização bancária.
- Endereço é chamado **Billing Address** na aplicação. Não há etapa de entrega distinta comprovada. O preenchimento acompanha a consulta demonstrativa de CEP.
- Contratos de erro da API e a classificação definitiva do API-001 ainda exigem confirmação da especificação.
- Validação funcional em Windows/macOS/Apple Silicon permanece pendente. As evidências remotas se referem ao commit indicado, sem inferir sucesso de versões futuras.

Documentação: [estratégia e pendências](docs/test-strategy.md), [API-001](docs/findings.md), [inspeção do checkout](docs/checkout-investigation.md), [mobile](docs/mobile-feasibility.md), [performance](docs/performance-results.md).
