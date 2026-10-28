# Estratégia, rastreabilidade e pendências

## Ambiente e responsabilidades

O E2E obrigatório executa em uma instância Toolshop Sprint 5 privada, com imagens fixadas por digest, banco efêmero por execução, seed conhecido e rede Docker interna. `python3 scripts/run_e2e.py` inicia o ambiente, executa TypeScript, testes das restrições de isolamento e Cucumber, preserva evidências e remove somente os recursos do projeto recém-criado.

Navegador, Angular e listener HTTP compartilham loopback dentro do Docker. Não há portas publicadas nem dependência do catálogo público. Login negativo e criação de pedidos exigem flags explícitas e URL loopback; os hooks bloqueiam requisições externas e service workers. A API de auditoria exige loopback, não segue redirects e usa somente a conta demonstrativa administrativa do banco descartável. A suíte é sequencial: a comparação de contagem de pedidos pressupõe ausência de outro escritor nesse banco.

Page Objects concentram locators e ações de interface. Steps contêm as assertivas de negócio; rotas e leitura das respostas HTTP do checkout ficam em `support/`, junto da configuração, dados sintéticos, auditoria e diagnósticos. Cada cenário recebe contexto novo. As validações de pagamento aguardam respostas reais e a confirmação visual; não há retries de cenário nem sleeps fixos.

O endereço demonstrativo é preenchido a partir da resposta de `/postcode-lookup`, evitando disputa com o autopreenchimento da interface. Nos negativos, o campo do exemplo é esvaziado depois do preenchimento. A aceitação do endereço no backend permanece validada pela criação do pedido positivo.

## Matriz de cobertura

| Requisito do desafio | Implementação | Evidência / limite |
| --- | --- | --- |
| API: GET, POST, PUT, DELETE | `api/tests/` | HTML/JUnit da regressão: 22 testes; validar contrato completo dos erros permanece pendente |
| API: entradas inválidas, ausências, autenticação | Testes negativos e API-001 separado | 1 falha real preservada no diagnóstico; não compõe a regressão aprovada |
| Web: login e navegação ao formulário | `login.feature`, `account_navigation.feature` | Cenários incluídos na suíte isolada |
| Web: senha incorreta e usuário inexistente | `@login-negative` | Executados apenas na instância descartável |
| Web: campos obrigatórios | `@login-validation` | Validação de email e senha, inclusive ambos vazios |
| Web: carrinho e totais | `checkout.feature` | Produto, quantidade, preço unitário, linha e total |
| Web: endereço incompleto | Cinco exemplos em `checkout.feature` | Billing Address; não se afirma existir etapa de entrega separada |
| Web: pagamento e compra completa | `payment.feature` positivo | Cartão sintético, pagamento demonstrativo, HTTP 201, confirmação UI, pedido consultado pela API, produto/quantidade/preço/subtotal e contagem |
| Web: cartão inválido | `payment.feature` negativo | Formato inválido, mensagem específica, botão desabilitado, confirmação ausente e contagem de pedidos inalterada |
| Relatório Web | Cucumber HTML e JUnit | Screenshot de cada cenário isolado, resumo do pedido e diagnósticos em falhas |
| Web em outra origem | Mesmo código com `WEB_BASE_URL` público | [10 cenários seguros aprovados](evidence/web-second-origin.md); login positivo público não comprovado por bloqueio da conta compartilhada |
| CI: API, Web, mobile após commits | Quality e Mobile Android Tests | Push na main e PR; [execuções atuais aprovadas](evidence/ci-validation.md) |
| Carga opcional | k6 500 VUs por 5 minutos | 150.000 requisições, zero erros, três thresholds aprovados na execução local de referência |
| Mobile opcional | Dois testes Appium | Login simulado/navegação e gravação local após reinício; 2 aprovados no PR #2, além do histórico em mobile-feasibility.md |
| README e publicação | README e workflows no GitHub | Entrega integrada à main pelo PR #2; clone padrão e comandos diretos independentes de Make |

## Contratos, achados e dados

A API cria dados independentes e tenta remover somente as reservas criadas pelo próprio teste. `.env.example` contém a conta pública demonstrativa; uma instância autorizada alternativa usa URL e credenciais de seu próprio `.env`. Não há credenciais privadas versionadas.

A regressão completa agora usa `scripts/run_api.py`: imagem do autor fixada por digest, container por execução e porta aleatória publicada somente em loopback. As credenciais demonstrativas ficam em `api/isolated/credentials.env`; segredos herdados do host não são usados. A coleta bloqueia os seis negativos de autenticação/autorização fora de loopback com opt-in explícito. Redirects HTTP ficam desativados. O runner salva logs e ambiente e remove somente seu próprio projeto Docker. Treze testes verificam a proteção e a remoção de evidências antigas em falha de pré-requisito.

O API-001 espera HTTP 400/422 e recebe 500. Continua FAILED em diagnóstico separado; o CI registra o resultado original da etapa com `continue-on-error`, sem apresentá-lo como aprovado. A classificação definitiva como defeito contratual depende da especificação. Não usar XFAIL, SKIP ou aceitar 500 como solução.

Os dados de cartão são sintéticos. O Toolshop valida formato e simula sucesso; não há gateway bancário. A auditoria do pedido consulta o banco por uma rota independente da resposta de criação. A fila de email não é processada nesta entrega; entrega de email não está sendo comprovada.

## Histórico ambiental

A suíte pública anterior passou localmente com sete cenários seguros, mas falhou no GitHub por HTTP 403/Cloudflare antes do catálogo. Isso foi uma falha ambiental, não evidência de defeito de checkout. O job atual usa instalação privada; os resultados antigos continuam relevantes somente como histórico, não como estado da implementação atual.

Em 28/10/2026, o código `c35066b` aprovou 10 cenários seguros em uma segunda origem Web pública. Dois logins positivos falharam porque a conta compartilhada estava bloqueada; a [evidência](evidence/web-second-origin.md) separa a tentativa de 12 cenários da seleção limpa de 10. Não houve novas tentativas de autenticação após o bloqueio.

Durante a validação da instância privada, uma execução encontrou HTTP 422 no positivo por incompatibilidade entre o endereço preenchido manualmente e a consulta de CEP. A correção sincroniza os dados com essa consulta e preserva a exigência de HTTP 201. Outra execução inicial aprovou os cenários, mas falhou ao salvar o HTML por diferença de UID; o executor agora passa UID/GID do host e mantém a falha de relatório como erro real.

## Pendências e estratégia de conclusão

A validação remota anterior de API, E2E completo e mobile foi concluída no PR #2. [Registro do commit, resultados e artifacts](evidence/ci-validation.md). A revisão final `3ad8224` foi validada remotamente com API, E2E, mobile e checks Python Windows/macOS aprovados; consulte o mesmo registro. As [evidências locais](evidence/local-validation.md) permanecem separadas.

| Prioridade | Item restante | Próxima ação | Critério de aceite |
| --- | --- | --- | --- |
| Média | Contratos negativos da API | [Revisão da implementação](api-error-contracts.md) acrescenta status exatos, media type e corpo em 11 casos; falta contrato normativo e revisão implantada | Distinguir caracterização da implementação de especificação publicada |
| Média | API-001 | Inspeção fundamenta problema de tratamento de entrada; confirmar status normativo com mantenedor | Resultado FAILED preservado; não afirmar violação de status publicado |
| Média | Windows/macOS/Apple Silicon | Reproduzir comandos em instalações limpas com Docker Desktop | Relatórios por sistema/arquitetura; documentar incompatibilidades de imagem |
| Baixa | Login Web em segunda origem | Dez cenários seguros passaram no público com o mesmo código; conta compartilhada bloqueou login positivo | Usar conta autorizada própria em outra instância compatível, sem insistir na conta pública |
| Baixa | Endereço no checkout | Explicitar ao avaliador que os cinco negativos usam Billing Address | Não apresentar como comprovada etapa distinta de entrega |

A execução Linux comprova somente esse ambiente. Scripts Python evitam Bash/Make para E2E/carga, mas isso não comprova Docker Desktop nos demais sistemas. O host atual não possui Android SDK, adb ou KVM; resultados mobile devem vir de um runner preparado.
