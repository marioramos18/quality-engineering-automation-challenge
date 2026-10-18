# Estratégia de testes

## Seleção dos cenários

A regressão API reúne verificações de contrato, autenticação, autorização e validações que têm assertions explícitas. O teste `test_post_rejects_missing_firstname` permanece como diagnóstico `quality_finding`: espera HTTP 400/422 e atualmente documenta uma resposta HTTP 500 da API pública. Ele é executado em job separado, com resultado real de Pytest e relatório próprio.

No E2E contínuo, a tag `@checkout-safe` seleciona carrinho, checkout visitante até Payment e bloqueio de endereço incompleto. Esses cenários exercitam transições e valores visíveis sem concluir pedidos. Cenários de login negativo não participam do CI porque usam contas de demonstração compartilhadas.

## Isolamento e dados

Cada cenário Cucumber inicia e encerra seu próprio contexto de navegador. Os testes de checkout usam dados sintéticos e email `example.com`, não usam conta demonstrativa e não acionam `data-test="finish"`. Os testes API geram payloads independentes; a fixture de reserva criada tenta remover o registro após o cenário. O job de achados mantém a limpeza defensiva já existente no teste.

## Riscos do ambiente compartilhado

Os dois serviços públicos podem ficar indisponíveis, mudar resposta ou ter dados alterados por outros usuários. A seleção de produto no Toolshop depende de estoque disponível. Reservas criadas na API pública têm efeito temporário até a limpeza. Os relatórios devem distinguir indisponibilidade ambiental de uma divergência funcional reproduzível. A primeira execução do CI deve confirmar conectividade, disponibilidade de produto e escrita dos relatórios no volume Docker.

## Cobertura entregue e requisitos pendentes

| Área | Entregue no CI | Pendente |
| --- | --- | --- |
| API | Regressão e job diagnóstico do API-001 com HTML, JUnit XML e logs | Confirmação contratual do HTTP 500 |
| Carrinho | Produto disponível, quantidade, preço de linha e total | Variações adicionais de produto e desconto |
| Checkout visitante | Endereço válido até Payment e cinco campos ausentes no endereço | Pedido concluído e rejeição de cartão inválido |
| Autenticação web | Cenários existentes preservados no repositório | Execução negativa em ambiente isolado |

## Checkout completo em ambiente controlado

Para comprovar pedido concluído e pagamento inválido, executar uma instância privada e local do Toolshop com banco isolado e capturador de email, conforme a configuração Docker Compose descrita no repositório oficial. No positivo, `cash-on-delivery` evita dados de cartão; confirmar a resposta de criação da fatura, número do pedido, registro persistido e email capturado. No negativo, usar somente dados de cartão sintéticos e formato deliberadamente inválido; confirmar a resposta de validação, a mensagem da interface e a ausência de nova fatura. Antes de implementar esses testes, confirmar a versão da instância, os seletores e a sequência real do botão `finish`. Não usar a instância pública para criar pedidos de teste sem autorização explícita.
