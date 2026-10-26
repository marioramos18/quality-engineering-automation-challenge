# Revisão dos erros da API — 25/10/2026

Foram consultados os [comentários apiDoc e handlers oficiais](https://github.com/mwinteringham/restful-booker/blob/main/routes/index.js) e o [tratamento global de erros](https://github.com/mwinteringham/restful-booker/blob/main/app.js). Os comentários descrevem entradas e sucesso, sem especificar contratos de erro completos. As assertions abaixo caracterizam a implementação consultada; não são uma especificação normativa. A branch `main` é mutável e a revisão implantada no serviço público não foi confirmada.

| Caso | Base da expectativa | Assertions |
| --- | --- | --- |
| PUT incompleto | Handler rejeita falha de validação com 400 | 400, `text/plain`, `Bad Request`; reserva preservada |
| GET de ID inexistente | Handler responde 404 | 404, `text/plain`, `Not Found` |
| POST/DELETE em `/ping` | Rotas não definidas; fallback global | 404, `text/plain`, `Not Found` |
| JSON malformado | Parser anterior às rotas; erro global | 400, `text/plain`, `Bad Request`; PUT preserva a reserva |
| DELETE autorizado | Handler confirma remoção | 201, `text/plain`, `Created`; GET posterior retorna 404 |
| PUT/DELETE não autorizados | Handlers rejeitam token ausente/inválido | 403, `text/plain`, `Forbidden`; reserva preservada; somente ambiente isolado |

O media type é verificado sem fixar charset. Não se exige JSON de erro apenas porque a requisição envia `Accept: application/json`.

## API-001

O POST retorna explicitamente 500 quando a validação rejeita o payload; o PUT usa 400. Isso fundamenta a classificação como **problema de tratamento de entrada inválida**, compatível com o resultado observado. Não comprova violação de um contrato publicado de status: a documentação não promete 400/422 para esse caso.

O teste diagnóstico mantém a expectativa de qualidade 400/422. Nenhuma assertion foi alterada para aceitar 500. A confirmação de um status obrigatório depende de decisão contratual do mantenedor. A revisão final também reproduziu a falha na imagem privada fixada por digest.

## Validação e limites

Os 11 casos afetados passaram no serviço público em 25/10/2026: **11 aprovados, 0 falhas, 0 skips e 1 desmarcado**, em 7,04 s. Ruff e TypeScript (`tsc --noEmit`) passaram. Relatórios locais: `reports/api-contract-review/report.html` e `junit.xml`.

Comando executado:

```text
uv run --locked --env-file .env.example pytest api/tests/test_required_fields_negative.py api/tests/test_malformed_payload.py api/tests/test_invalid_resources_and_methods.py -m "not quality_finding" -v --html=reports/api-contract-review/report.html --self-contained-html --junitxml=reports/api-contract-review/junit.xml
```

O diagnóstico API-001 foi desmarcado nessa seleção inicial. A validação final posterior aprovou 22 testes na instância privada, 13 testes de proteção/runner e 16 testes seguros no público. O API-001 foi reexecutado separadamente e falhou por 500. O CI da revisão atual ainda não foi executado. [Evidências finais locais e comandos](evidence/local-validation.md).
