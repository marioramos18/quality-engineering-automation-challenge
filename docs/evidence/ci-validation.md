# Validação no GitHub Actions — 25/10/2026

Código validado: commit `d40edc768646a4c974030ba42d7e3bbec4d3ae79`, branch `feat/isolated-e2e-checkout`, [PR #2](https://github.com/marioramos18/quality-engineering-automation-challenge/pull/2). Esta documentação foi acrescentada depois da validação, sem alterar o código testado.

| Execução | Resultado observado | Evidência |
| --- | --- | --- |
| Quality — API Tests | 22 aprovados, 0 falhas, 0 ignorados na regressão; 1 diagnóstico desmarcado pela seleção | [Quality #24](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/40223251419), [artifact API](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/40223251419/artifacts/12610421153) |
| Quality — API-001 | 1 FAILED: esperado 400/422, observado 500; etapa diagnóstica não bloqueante | Mesmo artifact, pasta `api-quality-findings/`; resultado real preservado no log e JUnit |
| Quality — E2E isolated | 17 cenários e 103 passos aprovados, 0 falhas, 0 ignorados; Cucumber em 18,416 s | [Artifact E2E](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/40223251419/artifacts/12610600981) |
| Quality — restrições de isolamento | 4 testes aprovados, 0 falhas, 0 ignorados | Log do job E2E na execução Quality |
| Quality — TypeScript | `tsc --noEmit` concluído com sucesso antes da suíte | Log do job E2E na execução Quality |
| Mobile Android Tests | 2 testes aprovados, 0 falhas, 0 ignorados; Pytest em 79,65 s | [Mobile #15](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/40223251298), [artifact mobile](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/40223251298/artifacts/12610750829) |

Os dois workflows foram disparados por `pull_request`. Os jobs bloqueantes de API, E2E e mobile terminaram com conclusão `success`. O API-001 permanece uma falha real, mesmo com o job de API aprovado pela política diagnóstica explicitada no workflow.

O HTML E2E contém screenshots dos cenários e resumo da compra persistida. O artifact também contém `junit.xml`, `cucumber.log` e `services.log`. O mobile publica HTML/JUnit, logs e hierarquias disponíveis. Artifacts têm retenção limitada; os links podem exigir autenticação no GitHub. Não se deve apresentar esta tabela como validação de commits futuros.

## Cobertura acrescentada

- Autenticação negativa executada em banco e conta demonstrativa isolados.
- Compra concluída com cartão sintético aceito pelo validador demonstrativo, confirmação visual e consulta do pedido persistido, incluindo produto, quantidade, preço e subtotal.
- Número de cartão em formato inválido rejeitado na interface, com botão desabilitado e contagem de pedidos inalterada.
- Suíte E2E completa no CI sem depender do serviço público protegido por Cloudflare.

## Limites preservados

Pagamento não envolve autorização bancária. Endereço é de cobrança. Mobile valida login simulado e persistência local. Windows/macOS/Apple Silicon não foram validados funcionalmente nesta execução. Contratos de erro da API e a classificação definitiva do API-001 permanecem pendentes, conforme a [estratégia](../test-strategy.md).
