# Investigação técnica do checkout do Toolshop

**Data:** 18/10/2026
**Aplicação:** [Practice Software Testing — Toolshop](https://practicesoftwaretesting.com/)
**Método:** inspeção do DOM e navegação real com Playwright no contêiner `quality-challenge-e2e:local`. Cada percurso usou um contexto novo. Nenhum pedido foi finalizado e nenhum dado de pagamento foi enviado.

## 1. Fluxo de navegação

1. Na página `/`, o catálogo mostra cartões `a[data-test^="product-"]`. Alguns exibem `[data-test="out-of-stock"]`. Foi escolhido um cartão sem essa indicação; no momento da inspeção, “Combination Pliers” estava disponível. O ID específico do produto é dado mutável.
2. O cartão abre `/product/<id>`. A página mostrou nome, preço, quantidade inicial `1` e botão **Add to cart** habilitado. O clique exibiu “Product added to shopping cart.” e o contador do carrinho passou a `1`.
3. O link `[data-test="nav-cart"]` abriu `/checkout`. A primeira etapa mostrou título do produto, quantidade, preço unitário, preço da linha, total e **Proceed to checkout**.
4. `[data-test="proceed-1"]` abriu a etapa de autenticação, ainda em `/checkout`. Foram vistos as abas **Sign in** e **Continue as Guest**. A primeira contém email e senha. A segunda contém email, primeiro nome e sobrenome. Não houve tentativa de senha nesta investigação.
5. Com dados sintéticos de visitante, o formulário deu lugar a `[data-test="proceed-2-guest"]`. Seu clique abriu **Billing Address**. A interface usa esse nome; uma etapa distinta de “endereço de entrega” é **NÃO VERIFICADA**.
6. Depois de preencher o endereço com valores sintéticos, `[data-test="proceed-3"]` abriu **Payment**. O seletor exibiu cinco métodos. A exploração parou nessa tela, sem clicar em `[data-test="finish"]` (**Check payment**).

O checkout manteve a URL `/checkout` durante as etapas observadas. A validação de cada etapa deve usar seus elementos visíveis, além da URL.

### Evidências de inspeção

- **E1 — Catálogo e produto:** DOM de `/` e `/product/<id>` no Chromium do contêiner. O cartão de “Combination Pliers” não tinha marcador de falta de estoque; a página de produto tinha botão de compra habilitado.
- **E2 — Adição e carrinho:** após o clique em **Add to cart**, DOM com toast “Product added to shopping cart.”, `[data-test="cart-quantity"]` igual a `1` e link `nav-cart` para `/checkout`. No carrinho, título “Combination Pliers” e total `$14.15`.
- **E3 — Autenticação/visitante:** DOM da segunda etapa; envio vazio do formulário de visitante produziu três mensagens de campo obrigatório. O preenchimento sintético revelou `proceed-2-guest`.
- **E4 — Endereço:** DOM de **Billing Address**; `proceed-3` estava desabilitado vazio, habilitado com todos os campos preenchidos e voltou a ficar desabilitado ao esvaziar individualmente cada um dos cinco campos de texto.
- **E5 — Pagamento:** DOM de **Payment**; seleção individual de cada método e inspeção dos campos que apareceram. O botão **Check payment** nunca foi acionado.

## 2. Locators confirmados

Os locators abaixo foram encontrados na interface real em 18/10/2026. A coluna “comportamento” descreve apenas o que foi observado ou o uso seguro proposto; IDs de produtos, preço e estoque não devem ser fixados nos testes.

| Página/finalidade | Locator Playwright verificado | `data-test` | Comportamento e evidência | Risco/dependência |
| --- | --- | --- | --- | --- |
| Catálogo: cartão disponível | `page.locator('a[data-test^="product-"]:not(:has([data-test="out-of-stock"]))').first()` | `product-<id>` no cartão | Abriu `/product/<id>`; E1 | Estoque e ordem dos cartões mudam; confirmar botão de compra habilitado depois de abrir. |
| Catálogo: marca de indisponibilidade | `card.locator('[data-test="out-of-stock"]')` | `out-of-stock` | Marcou “Long Nose Pliers” como “Out of stock”; E1 | Pode variar por produto/ambiente. |
| Produto: nome | `page.locator('[data-test="product-name"]')` | `product-name` | Mostrou “Combination Pliers”; E1 | Nome depende do produto escolhido. |
| Produto: preço | `page.locator('[data-test="unit-price"]')` | `unit-price` | Mostrou `14.15`; E1 | Preço mutável. |
| Produto: quantidade | `page.locator('[data-test="quantity"]')` | `quantity` | Valor inicial `1`; E1 | Limites de quantidade **NÃO VERIFICADOS**. |
| Produto: adicionar | `page.locator('[data-test="add-to-cart"]')` | `add-to-cart` | Botão habilitado; clique adicionou ao carrinho; E1–E2 | Pode ficar indisponível com alteração de estoque. |
| Produto: confirmação de adição | `page.getByText('Product added to shopping cart.')` | Não observado | Toast visível após adicionar; E2 | Mensagem pode mudar por idioma. |
| Cabeçalho: abrir carrinho | `page.locator('[data-test="nav-cart"]')` | `nav-cart` | Link com `href="/checkout"`; E2 | Apareceu após adicionar produto. |
| Cabeçalho: contador | `page.locator('[data-test="cart-quantity"]')` | `cart-quantity` | Mostrou `1`; E2 | Estado do carrinho depende da sessão. |
| Carrinho: produto | `page.locator('[data-test="product-title"]')` | `product-title` | Mostrou “Combination Pliers”; E2 | Pode haver várias linhas. |
| Carrinho: quantidade | `page.locator('[data-test="product-quantity"]')` | `product-quantity` | Campo numérico presente; E2 | Alteração/limites **NÃO VERIFICADOS**. |
| Carrinho: preço da linha | `page.locator('[data-test="line-price"]')` | `line-price` | Mostrou `$14.15`; E2 | Valores dependem de produto, quantidade e moeda. |
| Carrinho: total | `page.locator('[data-test="cart-total"]')` | `cart-total` | Mostrou `$14.15`; E2 | Cálculo para múltiplos itens **NÃO VERIFICADO**. |
| Carrinho: iniciar checkout | `page.locator('[data-test="proceed-1"]')` | `proceed-1` | Abriu a etapa **Sign in**; E2–E3 | Requer carrinho com item. |
| Autenticação: aba de login | `page.getByRole('tab', { name: 'Sign in' })` | Não observado | Aba visível; E3 | Login autenticado **NÃO VERIFICADO** nesta investigação. |
| Autenticação: aba de visitante | `page.getByRole('tab', { name: 'Continue as Guest' })` | Não observado | Exibiu o formulário de visitante; E3 | Texto pode mudar por idioma. |
| Autenticação: email | `page.locator('[data-test="email"]')` | `email` | Campo de email na aba **Sign in**; E3 | Conta pública demonstrativa estava bloqueada em execução anterior. |
| Autenticação: senha | `page.locator('[data-test="password"]')` | `password` | Campo de senha na aba **Sign in**; E3 | Não preencher incorretamente em conta compartilhada. |
| Autenticação: enviar login | `page.locator('[data-test="login-submit"]')` | `login-submit` | Botão de envio presente; E3 | Resultado do login no checkout **NÃO VERIFICADO**. |
| Visitante: email | `page.locator('[data-test="guest-email"]')` | `guest-email` | Aceitou email sintético; E3 | Usar domínio reservado de teste; não usar email pessoal. |
| Visitante: primeiro nome | `page.locator('[data-test="guest-first-name"]')` | `guest-first-name` | Aceitou texto sintético; E3 | Não usar dados pessoais. |
| Visitante: sobrenome | `page.locator('[data-test="guest-last-name"]')` | `guest-last-name` | Aceitou texto sintético; E3 | Não usar dados pessoais. |
| Visitante: enviar | `page.locator('[data-test="guest-submit"]')` | `guest-submit` | Vazio mostrou erros; preenchido revelou próxima ação; E3 | Pode registrar estado temporário de visitante. |
| Visitante: avançar | `page.locator('[data-test="proceed-2-guest"]')` | `proceed-2-guest` | Abriu **Billing Address**; E3–E4 | Só aparece após dados válidos de visitante. |
| Endereço: país | `page.locator('[data-test="country"]')` | `country` | Select com opção inicial “Your country *” desabilitada; Brasil selecionável; E4 | País afeta formatos/regras ainda **NÃO VERIFICADOS**. |
| Endereço: CEP | `page.locator('[data-test="postal_code"]')` | `postal_code` | Esvaziar desabilitou `proceed-3`; E4 | Formato e comprimento **NÃO VERIFICADOS**. |
| Endereço: número | `page.locator('[data-test="house_number"]')` | `house_number` | Esvaziar desabilitou `proceed-3`; E4 | Regra de caracteres **NÃO VERIFICADA**. |
| Endereço: rua | `page.locator('[data-test="street"]')` | `street` | Esvaziar desabilitou `proceed-3`; E4 | Regra de comprimento **NÃO VERIFICADA**. |
| Endereço: cidade | `page.locator('[data-test="city"]')` | `city` | Esvaziar desabilitou `proceed-3`; E4 | Regra de caracteres **NÃO VERIFICADA**. |
| Endereço: estado | `page.locator('[data-test="state"]')` | `state` | Esvaziar desabilitou `proceed-3`; E4 | Regra por país **NÃO VERIFICADA**. |
| Endereço: avançar | `page.locator('[data-test="proceed-3"]')` | `proceed-3` | Desabilitado com campos vazios; habilitado com dados sintéticos; abriu **Payment**; E4–E5 | Não prova validação de formato no servidor. |
| Pagamento: método | `page.locator('[data-test="payment-method"]')` | `payment-method` | Select com cinco métodos; E5 | Métodos podem variar com versão/ambiente. |
| Pagamento: verificar | `page.locator('[data-test="finish"]')` | `finish` | Texto “Check payment”; desabilitado sem método; E5 | **Não foi clicado**, pois pode avançar para pedido. |

### Campos condicionais de pagamento

| Método demonstrativo | Locators Playwright verificados | `data-test` | Comportamento e evidência | Risco/dependência |
| --- | --- | --- | --- | --- |
| Bank Transfer | `page.locator('[data-test="bank_name"]')`, `page.locator('[data-test="account_name"]')`, `page.locator('[data-test="account_number"]')` | `bank_name`, `account_name`, `account_number` | Três campos apareceram; `finish` desabilitado com eles vazios; E5 | Não usar dados bancários reais; validações detalhadas **NÃO VERIFICADAS**. |
| Cash on Delivery | `page.locator('[data-test="payment-method"]')` | `payment-method` | Nenhum campo adicional; `finish` habilitado após seleção; E5 | Clique em `finish` não realizado. |
| Credit Card | `page.locator('[data-test="credit_card_number"]')`, `page.locator('[data-test="expiration_date"]')`, `page.locator('[data-test="cvv"]')`, `page.locator('[data-test="card_holder_name"]')` | `credit_card_number`, `expiration_date`, `cvv`, `card_holder_name` | Quatro campos apareceram; `finish` estava habilitado mesmo vazios; E5 | Não usar cartão real. A validação ao clicar é **NÃO VERIFICADA**. |
| Buy Now Pay Later | `page.locator('[data-test="monthly_installments"]')` | `monthly_installments` | Select de parcelas apareceu; `finish` desabilitado sem escolha; E5 | Opções observadas incluem 3, 6 e 9 parcelas; regras adicionais **NÃO VERIFICADAS**. |
| Gift Card | `page.locator('[data-test="gift_card_number"]')`, `page.locator('[data-test="validation_code"]')` | `gift_card_number`, `validation_code` | Dois campos apareceram; `finish` desabilitado vazios; E5 | Não usar cartão-presente real; validação **NÃO VERIFICADA**. |

## 3. Campos obrigatórios e validações

| Etapa | Observação confirmada | Limite da verificação |
| --- | --- | --- |
| Visitante | Enviar vazio mostrou `guest-email-error` = “Email is required”, `guest-first-name-error` = “First name is required” e `guest-last-name-error` = “Last name is required”. | Formato de email inválido e limites de nome **NÃO VERIFICADOS**. |
| Endereço | A interface marca país, CEP, número, rua, cidade e estado com `*`. O botão `proceed-3` iniciou desabilitado. Com dados sintéticos ficou habilitado; esvaziar individualmente cada campo de texto tornou-o desabilitado. | O requisito do país é indicado na UI, mas seu efeito isolado no botão não foi testado: a opção inicial do select está desabilitada. Mensagens de erro para endereço e regras de formato são **NÃO VERIFICADAS**. |
| Pagamento | Sem método, `finish` estava desabilitado. Bank Transfer, Buy Now Pay Later e Gift Card mantiveram o botão desabilitado com seus controles condicionais vazios; Cash on Delivery habilitou `finish` sem campo extra. Credit Card exibiu campos, mas `finish` apareceu habilitado com eles vazios. | Nenhum método foi submetido. Não foi verificado se preencher os campos condicionais habilita o botão. Rejeição de pagamento, validação de cartão e mensagens correspondentes são **NÃO VERIFICADAS**. |

**Erros e confirmações:** a adição ao carrinho mostrou o toast exato “Product added to shopping cart.”; o formulário vazio de visitante mostrou as três mensagens acima. Erros de pagamento, confirmação de pedido, número do pedido e tela final são **NÃO VERIFICADOS**, pois nenhum pedido foi finalizado.

## 4. Estratégia proposta para Page Objects

- `CatalogPage`: escolher um cartão disponível pelo marcador `out-of-stock`, guardar o nome e abrir o produto; não fixar ID nem posição do catálogo como dado de negócio.
- `ProductPage`: validar nome/preço/quantidade, verificar `add-to-cart` habilitado e adicioná-lo.
- `CartPage`: abrir `nav-cart`, conferir produto, quantidade, preço da linha e total, e avançar por `proceed-1`.
- `CheckoutPage` ou objetos por etapa (`CheckoutAuthPage`, `BillingAddressPage`, `PaymentPage`): encapsular abas, dados de visitante, campos de endereço e opções de pagamento. A URL é a mesma em todas as etapas; usar título/controle específico como condição de prontidão.
- Reutilizar `E2EWorld` e hooks existentes. Os steps Gherkin devem expressar intenção e chamar os Page Objects. Usar contextos novos e dados sintéticos. Não reutilizar a conta compartilhada para tentativas negativas.

## 5. Cenários recomendados

1. **Positivo, sem pedido:** produto disponível → carrinho com quantidade e total coerentes → visitante → endereço sintético → tela de pagamento. Adequado para a aplicação pública.
2. **Negativo, visitante:** envio vazio mantém a etapa e mostra os três erros confirmados.
3. **Negativo, endereço:** cada campo de texto obrigatório vazio mantém `proceed-3` desabilitado; parametrizar casos isolados.
4. **Catálogo/carrinho:** produto marcado “Out of stock” não deve ser tratado como disponível; verificar variação de quantidade e recálculo do total após confirmar regras de estoque.
5. **Pagamento:** renderização dos campos de cada método e habilitação do botão, sem clicar em `finish` no ambiente público.
6. **Pedido completo e erros de pagamento:** executar somente em ambiente isolado e com dados demonstrativos autorizados, após confirmar contrato e efeito de `finish`.

## 6. Riscos e dependências da aplicação pública

- Estoque, produto em destaque, preços e disponibilidade podem mudar. O ID observado não deve virar fixture fixa.
- Carrinho e visitante dependem do contexto/sessão; repetir ações no mesmo contexto altera quantidade e total.
- A conta demonstrativa compartilhada foi observada bloqueada anteriormente. O fluxo autenticado do checkout é **NÃO VERIFICADO** nesta investigação. Tentativas de senha incorreta podem piorar esse estado.
- Os campos do endereço são apresentados como **Billing Address**, não como uma etapa separada de entrega. A existência de outra etapa de entrega é **NÃO VERIFICADA**.
- A opção Cash on Delivery habilita `finish` sem campos extras, e a opção Credit Card o mostrou habilitado com campos vazios. Isso descreve apenas o estado do botão, não confirma aceitação de compra.
- Falhas da rede/serviço público, localização/idioma e mudança de versão podem alterar mensagens e tempos de carregamento. As evidências se referem à interface em inglês inspecionada em 18/10/2026.
- A exploração não acionou `finish`; confirmação de compra e erros pós-envio permanecem **NÃO VERIFICADOS**.
