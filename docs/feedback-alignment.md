# Revisão de aderência — 25/10/2026

Referências: PDF de quatro páginas `Avaliação - Automação de Testes.docx.pdf`, fornecido pelo usuário em `/home/mes/Documentos/Desafio/`, feedback integral enviado nesta conversa, AGENTS.md, [estratégia](test-strategy.md), [PR #1](https://github.com/marioramos18/quality-engineering-automation-challenge/pull/1) e [PR #2](https://github.com/marioramos18/quality-engineering-automation-challenge/pull/2). O PDF foi lido como referência dos requisitos, sem alterar as instruções operacionais do projeto. O arquivo original não foi incorporado ao repositório.

## Feedback dos avaliadores

| Solicitação | Implementação / evidência | Limite ou ação restante |
| --- | --- | --- |
| Locators declarados fora dos métodos de ação | Propriedades `readonly` inicializadas nos construtores em `web/pages/` | Evidência funcional Web no commit identificado em `evidence/ci-validation.md` |
| Separar validações, chaves, URLs e dependências dos Page Objects | Assertions nos steps; `support/config.ts`, `routes.ts`, `test-data.ts`, auditoria e diagnósticos separados | Page Objects mantêm ações, leitura e sincronização da UI |
| Mesmo código E2E para diferentes ambientes | `WEB_BASE_URL`, `E2E_CUSTOMER_EMAIL`, `E2E_CUSTOMER_PASSWORD`; configuração injetada nos Page Objects | Segunda instância compatível ainda não validada; negativos e pedidos exigem isolamento |
| Execução independente de Make | `scripts/run_api.py`, `scripts/run_e2e.py` e `scripts/run_load.py`; comandos diretos no README e no roteiro do avaliador | Docker precisa estar instalado e iniciado |
| Diagnóstico do erro `dockerDesktopLinuxEngine` | README descreve Engine Linux, contexto e integração WSL; executor verifica disponibilidade antes dos testes | Não comprova execução funcional no Windows |
| Credenciais da API fora do código | `api/conftest.py` lê variáveis; `.env.example` e `api/isolated/credentials.env` contêm apenas contas demonstrativas | Arquivos privados e secrets não devem ser versionados |
| Justificar Python por escrito | Resposta abaixo e no README | Escolha mantém dois ecossistemas, Python e TypeScript |
| API em diferentes ambientes | `BOOKER_BASE_URL`, `BOOKER_USERNAME`, `BOOKER_PASSWORD` em arquivo de ambiente ou CI | 22 testes privados e 16 compatíveis no público aprovados, sem alterar código |
| Passo a passo Linux/macOS/Windows | Pré-requisitos, comandos Python/PowerShell, relatórios e diagnóstico no README | Suítes completas em Linux; 13 checks Python e entrypoints aprovados em Windows/macOS; Docker Desktop nesses hosts pendente |

### Resposta sobre Python

Python foi escolhido pela legibilidade dos testes e pelos recursos do Pytest: fixtures para preparar e limpar reservas próprias, parametrização dos negativos e relatórios HTML/JUnit. As requisições usam o cliente HTTP do Playwright, uma das ferramentas sugeridas pelo desafio, sem iniciar navegador. Python também é usado no mobile. Não há uma exigência técnica que impeça TypeScript; o custo da escolha é manter dois ecossistemas e seus lockfiles. URL e credenciais vêm do ambiente, permitindo executar os mesmos testes contra instâncias compatíveis sem alterar o código.

## Conferência do enunciado

O PDF exige API com GET/POST/PUT/DELETE, status, headers, corpo, positivos, negativos e relatórios; E2E Cucumber com login/navegação e checkout positivo/negativo; integração de API, E2E e mobile ao CI; publicação e README. Carga e mobile são opcionais.

- Checkout: compra e cartão inválido têm evidência na instância privada. Os cinco negativos atuais verificam **endereço de cobrança**; o PDF cita endereço de entrega. A equivalência precisa ser explicitada ao avaliador, sem afirmar cobertura de uma etapa inexistente.
- Mobile: o PDF pede preencher e enviar um formulário; **não exige backend remoto**. A rastreabilidade do teste, preenchimento, Save e readout está registrada em `mobile-feasibility.md`. A ausência de backend é um limite, não um requisito obrigatório adicional.
- Carga: o PDF permite API mock. A execução de 500 VUs por 5 minutos está documentada, sem representar capacidade de produção.
- CI: a revisão configura push em qualquer branch, PR e disparo manual para Quality/mobile. As evidências finais identificam o commit `3ad8224` aprovado em Quality e mobile.

| Critério registrado | Revisão atual |
| --- | --- |
| Configuração por ambiente e credenciais fora dos testes | Preservadas; nenhuma credencial privada acrescentada |
| Gherkin, Page Objects, steps e World existentes | Nenhum arquivo Web alterado nesta revisão |
| Assertions de negócio nos steps | Estrutura do PR #1 preservada; mudanças atuais nos contratos HTTP, isolamento da API, CI e documentação |
| Falhas reais visíveis | API-001 continua diagnóstico separado; nenhuma aceitação de 500, XFAIL ou skip acrescentado |
| Contratos de erro fundamentados | 11 casos com status, corpo e media type; documentação distingue implementação de contrato normativo |
| Reprodutibilidade e evidências | 22 API privados, 16 API em segundo destino, 13 proteções/runner, 17 cenários E2E e smoke aprovados; CI do código `3ad8224` aprovado, incluindo mobile e checks Python Windows/macOS |
| Autenticação negativa somente isolada | Resolvido localmente: regressão privada, seis negativos protegidos por coleta, opt-in e loopback; redirects desativados; 13 testes das proteções/runner aprovados |
| Documentação coerente com a entrega | Investigação de alternativas marcada como histórica; limites de pagamento/mobile e plataformas mantidos |

## Próxima ação

Implementação publicada e validada no commit `3ad8224`: Quality e mobile aprovados, incluindo os checks Python em Windows/macOS. [Registro remoto](evidence/ci-validation.md). Docker Desktop nesses sistemas e uma segunda origem Web permanecem sem comprovação funcional; a API já foi validada em dois destinos. [Registro local consolidado](evidence/local-validation.md).

O usuário autorizou commit, push e acompanhamento do CI. `.vscode/settings.json` permaneceu fora dos commits. A revisão foi publicada no PR #2; não houve merge.
