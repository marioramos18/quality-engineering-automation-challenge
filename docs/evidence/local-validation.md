# Validação local da revisão — 25/10/2026

Registro da execução local anterior à publicação: árvore de trabalho baseada em `1117221`, posteriormente publicada em `0c44395`. A correção Android posterior e o CI aprovado do código `3ad8224` estão em [ci-validation.md](ci-validation.md). Ambiente Linux x86_64, Docker Compose 2.35.1, testes API em Python 3.12.8. Estes resultados não substituem validação remota do próximo commit.

| Área | Resultado | Evidência local |
| --- | --- | --- |
| API privada completa | 22 aprovados, 0 falhas, 0 skips; 1 diagnóstico desmarcado; 1,15 s | `reports/api-regression/report.html`, `junit.xml`, `pytest.log`, `environment.txt`, `services.log` |
| API-001 privado | 1 FAILED por HTTP 500; 0 skips; 0,53 s; saída 1 preservada | `reports/api-quality-findings/` |
| Proteções API / runner | 13 aprovados, 0 falhas, 0 skips; 0,58 s | `reports/api-guards/junit.xml` |
| API segundo destino (público) | 16 aprovados, 0 falhas, 0 skips; 7 desmarcados; 11,18 s | `reports/api-external/report.html`, `junit.xml` |
| E2E privado | 17 cenários e 103 passos aprovados, 0 falhas, 0 skips; 31,669 s | `reports/e2e-isolated/e2e-report.html`, `junit.xml`, `cucumber.log`, `services.log` |
| TypeScript / isolamento Web | Typecheck aprovado; 4 testes aprovados, 0 falhas, 0 skips | Saída do runner E2E |
| Carga smoke atual | 10 VUs / 15 s; 150 requisições; 0% erros; 3 thresholds aprovados | `reports/performance/smoke-summary.json` e `.txt` |
| Qualidade estática | Ruff, compilação dos runners, leitura YAML e `git diff --check` aprovados | Saídas locais; leitura YAML não equivale a execução do Actions |

## Execução e escopo

- API privada: `.venv/bin/python scripts/run_api.py`; imagem do autor `mwinteringham/restfulbooker@sha256:7c94ad49f9a9db99760229bf81c04be946c23beb1dbb01f2aa36e1b3db89e81a`, porta aleatória de loopback e container próprio. Credenciais demonstrativas separadas em arquivo de configuração. O Python padrão do host é 3.8; por isso foi usado o Python 3.12 do projeto. O runner também compila no Python padrão, mas os testes usam 3.12 pelo uv.
- Diagnóstico: `.venv/bin/python scripts/run_api.py --finding`; resultado original FAILED, sem XFAIL ou skip. A ausência de `firstname` continua produzindo 500.
- Proteções: `.venv/bin/python -m pytest tests -q --junitxml=reports/api-guards/junit.xml`. Inclui coleta bloqueada no destino público e remoção de relatórios antigos quando Docker está indisponível. A chamada direta `.venv/bin/pytest tests` também passou, reproduzindo a forma usada no CI.
- Segundo destino: `uv run --locked --env-file .env.example pytest api/tests -m "not quality_finding and not isolated_auth" -v --html=reports/api-external/report.html --self-contained-html --junitxml=reports/api-external/junit.xml`. Os mesmos arquivos de teste executaram em privado e no público sem alteração de código. Foram excluídos os seis negativos de autenticação/autorização e o diagnóstico; somente reservas próprias foram modificadas.
- E2E: `python3 scripts/run_e2e.py`; serviços, banco e volume descartáveis. Compra demonstrativa com auditoria independente e cartão inválido passaram. Nenhum pedido no serviço público.
- Carga: `python3 scripts/run_load.py smoke`; p95 6,98 ms, 9,97 req/s, zero erros de contrato e HTTP. A carga completa de 500 VUs / 5 minutos permanece a execução anterior em [performance-results.md](../performance-results.md), sem nova medição completa nesta revisão.

As execuções finais removeram seus próprios containers, redes e volume E2E. Tentativas iniciais de provisionamento da API falharam por imagem inacessível e publicação de porta em rede interna; foram corrigidas antes da regressão final. Esses erros foram ambientais, não defeitos dos endpoints.

## Limites

Mobile mantém a evidência remota anterior de dois testes aprovados; não há Android SDK/KVM neste host para uma nova execução local. Docker Desktop em Windows/macOS/Apple Silicon não foi executado. As verificações nativas Python Windows/macOS e o mobile foram posteriormente aprovados no CI do código `3ad8224`, conforme registro remoto. Uma segunda origem Web também não foi validada.

O endereço da aplicação é de cobrança; não se comprova etapa distinta de entrega. O envio do formulário mobile é local via Save e leitura do valor persistido. O diagnóstico API-001 não impede entregar a análise do desafio, mas permanece uma falha explícita.
