# Quality Engineering Automation Challenge

Automação de API e navegador para duas aplicações públicas de demonstração. Os resultados da execução automática ficam na aba **Actions** do GitHub, no workflow **Quality**. Cada execução publica relatórios como artifacts ao final de cada job.

## Arquitetura

| Módulo | Tecnologia | Escopo atual |
| --- | --- | --- |
| `api/` | Python 3.12, Pytest, cliente HTTP do Playwright | Contratos e cenários negativos do Restful Booker |
| `web/` | TypeScript, Cucumber.js, Playwright, Page Objects | Carrinho e checkout visitante até Payment; outros cenários ficam fora do CI seguro |
| `mobile/` e `performance/` | Appium e k6 | Diretórios reservados; sem jobs neste workflow |
| `docs/` | Markdown | [Estratégia](docs/test-strategy.md), [achados](docs/findings.md) e [investigação do checkout](docs/checkout-investigation.md) |

As fixtures em `api/conftest.py` criam dados de reserva e removem as reservas geradas. No navegador, `E2EWorld` e os hooks abrem um contexto novo por cenário; os Page Objects concentram os seletores. O checkout automatizado termina na tela de pagamento, sem acionar `finish`.

## Pré-requisitos

- Para API local: Python 3.12 e [uv](https://docs.astral.sh/uv/).
- Para E2E local: Docker com daemon ativo. A imagem Playwright usada está em `web/Dockerfile`; o primeiro build baixa a imagem e instala as dependências de `web/package-lock.json`.
- Acesso de rede a `restful-booker.herokuapp.com` e `practicesoftwaretesting.com`. Nenhuma credencial privada é exigida para os comandos seguros.

Execute os comandos na raiz do repositório. Para apontar a API para outro ambiente, configure `BOOKER_BASE_URL`; o padrão está em `api/conftest.py`.

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
  -v "$PWD/reports:/workspace/reports" \
  quality-challenge-e2e:local \
  npm test -- --tags @checkout-safe
```

A tag `@checkout-safe` inclui carrinho, avanço como visitante até Payment e validação de endereço incompleto. Ela não inclui os cenários de login negativo em contas compartilhadas. Os testes de checkout **não finalizam pedidos**.

Para conferir os tipos TypeScript sem usar Docker: `cd web && npm ci && npx tsc --noEmit`.

## Relatórios e GitHub Actions

Abra `reports/api-regression/report.html`, `reports/api-quality-findings/report.html` ou `reports/e2e-report.html` no navegador depois da execução local. O relatório Cucumber incorpora screenshots de cenários que falham, capturadas pelo hook `After`. Logs e JUnit XML também são gerados para os jobs de API. A pasta `reports/` está ignorada pelo Git.

O workflow `.github/workflows/quality.yml` roda em `push` para `main`, `pull_request` e manualmente em `workflow_dispatch`. Na aba **Actions**, abra uma execução e baixe os artifacts `api-regression-reports`, `api-quality-findings-reports` e `e2e-safe-reports`.

| Job | Execução | Política de falha |
| --- | --- | --- |
| API Regression | Ruff e Pytest, excluindo `quality_finding` | Falha bloqueia o job |
| API Quality Findings | Executa somente `test_post_rejects_missing_firstname` | Mantém o resultado FAILED e seus relatórios; `continue-on-error` impede que o achado conhecido bloqueie os outros jobs |
| E2E Safe | Imagem Docker existente, somente `@checkout-safe` | Falha bloqueia o job |

Os jobs são independentes. A separação permite distinguir regressões dos cenários seguros do diagnóstico API-001, sem transformar uma falha conhecida em PASS, XFAIL ou SKIP.

## Limitações da execução E2E no GitHub Actions

Na execução local com Docker, os **7 cenários `@checkout-safe` e 41 steps passaram**. No GitHub Actions, os **7 cenários ficaram FAILED** no mesmo ponto, antes da seleção do produto: a navegação para `https://practicesoftwaretesting.com/` recebeu **HTTP 403** do Cloudflare, apresentou a página **"Just a moment..."** de verificação humana e não renderizou produtos.

O artifact `e2e-safe-reports` da execução no GitHub contém o relatório HTML (`e2e-report.html`), o log (`e2e-safe.log`) e os JSONs e screenshots em `catalog-diagnostics/`. Os diagnósticos registram URL, título, status HTTP, contagens de produtos e imagem da página. Essas evidências mostram uma barreira de acesso no runner do CI; os testes não chegaram a exercitar o carrinho ou o checkout. Por isso, a falha **não comprova um defeito funcional** nesses fluxos.

Não adotamos proxies, técnicas de ocultação do navegador nem automação da verificação humana para contornar a proteção anti-bot da aplicação pública. A **execução E2E no GitHub permanece não atendida e o job permanece FAILED**. Uma solução definitiva depende de um ambiente Toolshop autorizado e acessível ao runner do CI. Checkout concluído e rejeição de cartão inválido também permanecem fora da cobertura implementada.

## Limitações e cobertura pendente

Restful Booker e Toolshop são serviços públicos compartilhados; disponibilidade, dados e comportamento podem mudar durante a execução. O [achado API-001](docs/findings.md) registra HTTP 500 ao criar uma reserva sem `firstname`; a classificação contratual permanece em investigação.

**Checkout concluído e rejeição de cartão inválido não foram automatizados.** A conclusão cria uma fatura e pode acionar email e atualização de estoque. Para cobrir esses requisitos, use uma instância local controlada do Toolshop, com dados e caixa de email isolados, conforme a [estratégia de testes](docs/test-strategy.md).
