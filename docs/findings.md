# Quality Findings

## API-001 — Erro interno ao criar reserva sem firstname

**Status:** Em investigação  
**Severidade sugerida:** Média  
**Ambiente:** Restful Booker — API pública de demonstração

### Cenário

Enviar uma requisição `POST /booking` com um payload de reserva válido, porém sem o campo `firstname`.

### Resultado esperado

A API deve rejeitar a entrada inválida com uma resposta HTTP 4xx apropriada e uma mensagem que permita identificar o problema.

### Resultado observado

- HTTP 500 — Internal Server Error
- Corpo: `Internal Server Error`
- Cenário reproduzido durante a execução automatizada.

### Evidência

`api/tests/test_required_fields_negative.py::test_post_rejects_missing_firstname`

Relatório atual: `reports/api-quality-findings/report.html` (pasta `api-quality-findings/` do artifact `api-tests-reports` no GitHub Actions). O resumo da execução mostra o `outcome` original da etapa diagnóstica.

### Análise

O servidor respondeu com um erro interno diante de uma entrada incompleta.

A divergência sugere possível ausência de tratamento adequado para campos obrigatórios. A classificação definitiva como defeito contratual depende da confirmação da especificação da API.

### Decisão de qualidade

O teste permanece com status FAILED, preservando a divergência observada.

Não foi utilizada uma assertion que aceita HTTP 500, nem uma marcação XFAIL para ocultar a falha da execução principal.
