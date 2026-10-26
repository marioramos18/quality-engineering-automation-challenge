# Quality Findings

## API-001 — Erro interno ao criar reserva sem firstname

**Status:** Problema de tratamento de entrada inválida fundamentado por inspeção; contrato normativo pendente

**Severidade sugerida:** Média  
**Ambiente:** Restful Booker — demonstração pública e imagem privada fixada por digest

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

A revisão local final reproduziu HTTP 500 com `scripts/run_api.py --finding` em container privado. O relatório local não deve ser confundido com o artifact do CI anterior. [Registro da execução atual](evidence/local-validation.md).

### Análise

O servidor respondeu com um erro interno diante de uma entrada incompleta.

A inspeção do código oficial em 25/10/2026 encontrou resposta explícita 500 quando a validação do POST falha, enquanto o PUT responde 400. Isso fundamenta um problema de tratamento de entrada inválida. A documentação não especifica o status desse erro; 400/422 permanece uma expectativa de qualidade do teste, sem comprovar violação de contrato publicado. A revisão implantada no serviço público não foi confirmada. [Fontes e limites da revisão](api-error-contracts.md).

### Decisão de qualidade

O teste permanece com status FAILED, preservando a divergência observada.

Não foi utilizada uma assertion que aceita HTTP 500, nem uma marcação XFAIL para ocultar a falha da execução principal.
