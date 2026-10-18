# Estratégia de testes

## Seleção dos cenários

A regressão API reúne verificações de contrato, autenticação, autorização e validações que têm assertions explícitas. O teste `test_post_rejects_missing_firstname` permanece como diagnóstico `quality_finding`: espera HTTP 400/422 e atualmente documenta uma resposta HTTP 500 da API pública. Ele é executado em job separado, com resultado real de Pytest e relatório próprio.

No job E2E, a tag `@checkout-safe` seleciona carrinho, checkout visitante até Payment e bloqueio de endereço incompleto. Esses cenários foram implementados para exercitar transições e valores visíveis sem concluir pedidos. Cenários de login negativo não participam do CI porque usam contas de demonstração compartilhadas.

Os cenários `@login-negative` só podem começar quando `E2E_ALLOW_NEGATIVE_AUTH=1` e `WEB_BASE_URL` aponta para loopback. O hook rejeita o destino público antes de iniciar o navegador e bloqueia requisições externas durante esses cenários, inclusive redirecionamentos. Para reproduzi-los, use uma instância Toolshop própria, autorizada e com conta de teste isolada, conforme o comando do [README](../README.md#login-negativo-em-ambiente-isolado). A restrição produz falha explícita; não usa SKIP ou XFAIL.

## Isolamento e dados

Cada cenário Cucumber inicia e encerra seu próprio contexto de navegador. Os testes de checkout usam dados sintéticos e email `example.com`, não usam conta demonstrativa e não acionam `data-test="finish"`. Os testes API geram payloads independentes; a fixture de reserva criada tenta remover o registro após o cenário. O job de achados mantém a limpeza defensiva já existente no teste.

## Riscos do ambiente compartilhado

Os dois serviços públicos podem ficar indisponíveis, mudar resposta ou ter dados alterados por outros usuários. A seleção de produto no Toolshop depende de estoque disponível. Reservas criadas na API pública têm efeito temporário até a limpeza. Os relatórios devem distinguir indisponibilidade ambiental de uma divergência funcional reproduzível. No GitHub Actions, a proteção do Cloudflare impediu o acesso ao catálogo antes que a disponibilidade de produto pudesse ser avaliada.

## Limitações da execução E2E no GitHub Actions

A execução local com Docker comprovou **7 cenários e 41 steps aprovados** para `@checkout-safe`. No GitHub Actions, os **7 cenários ficaram FAILED** em `CatalogPage.openAvailableProduct()`. Os sete diagnósticos registraram **HTTP 403** na navegação para `https://practicesoftwaretesting.com/`, título **"Just a moment..."**, página de verificação humana do Cloudflare e **zero produtos renderizados**. Todos falharam antes de acessar um produto.

O artifact `e2e-safe-reports` disponibiliza `e2e-report.html`, `e2e-safe.log` e os pares JSON/PNG em `catalog-diagnostics/`. O JSON registra a URL e as respostas HTTP; o PNG mostra a página exibida. A combinação desses registros permite distinguir bloqueio de acesso no runner de falha funcional: os passos de carrinho e checkout não foram alcançados no CI. Os resultados locais demonstram que os cenários funcionaram naquele ambiente, mas não substituem uma execução aprovada no GitHub.

Não usamos proxies, disfarces de navegador ou automação da verificação humana para contornar a proteção anti-bot. O job E2E continua **FAILED** e a execução E2E no GitHub permanece **não atendida**. Para torná-la reproduzível, é necessário um ambiente Toolshop autorizado e acessível ao CI, com dados de teste controlados. As assertions, os timeouts, os locators e os critérios de sucesso permanecem intactos.

## Cobertura entregue e requisitos pendentes

| Área | Cobertura implementada | Pendente |
| --- | --- | --- |
| API | Regressão e job diagnóstico do API-001 com HTML, JUnit XML e logs | Confirmação contratual do HTTP 500 |
| Carrinho | Produto disponível, quantidade, preço de linha e total; aprovado localmente | Execução E2E no GitHub bloqueada por HTTP 403; variações adicionais de produto e desconto |
| Checkout visitante | Endereço válido até Payment e cinco campos ausentes no endereço; aprovado localmente | Execução E2E no GitHub bloqueada por HTTP 403; pedido concluído e rejeição de cartão inválido não implementados |
| Autenticação web | Cenários existentes preservados no repositório | Execução negativa em ambiente isolado |

A [comparação de ShopDemo e Maison](ecommerce-alternatives.md) não levou à migração: a primeira depende de licença explícita e prova de CI; a segunda confirma compras locais, mas não rejeita o número de cartão inválido e não oferece os campos/etapas do checkout visitante atual. Portanto, continuam obrigatórios e **não atendidos**: E2E aprovado no GitHub Actions, checkout concluído automatizado e rejeição de cartão inválido automatizada. Uma alternativa só deve substituir o Toolshop após demonstrar ganho de cobertura reproduzível sem apagar essas lacunas.

## Checkout completo em ambiente controlado

Para comprovar pedido concluído e pagamento inválido, executar uma instância privada e local do Toolshop com banco isolado e capturador de email, conforme a configuração Docker Compose descrita no repositório oficial. No positivo, `cash-on-delivery` evita dados de cartão; confirmar a resposta de criação da fatura, número do pedido, registro persistido e email capturado. No negativo, usar somente dados de cartão sintéticos e formato deliberadamente inválido; confirmar a resposta de validação, a mensagem da interface e a ausência de nova fatura. Antes de implementar esses testes, confirmar a versão da instância, os seletores e a sequência real do botão `finish`. Não usar a instância pública para criar pedidos de teste sem autorização explícita.
