# Validação no GitHub Actions — 25/10/2026

## Revisão final — commit 3ad8224

Código validado: `3ad822468bb36a0236a742a9eb4a93e58cc349fb`, branch `feat/isolated-e2e-checkout`, [PR #2](https://github.com/marioramos18/quality-engineering-automation-challenge/pull/2). Os artifacts foram baixados e os JUnit conferidos. A atualização documental posterior não altera esse código.

| Execução | Resultado conferido | Evidência |
| --- | --- | --- |
| API privada | 22 aprovados, 0 falhas, 0 erros, 0 skips; 0,645 s | [Quality — PR](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/40251176474), artifact `api-tests-reports` |
| Proteções API / runner Linux | 13 aprovados, 0 falhas, 0 skips | Mesmo artifact, `api-guards/junit.xml` |
| API-001 | 1 FAILED por HTTP 500; saída original preservada no diagnóstico não bloqueante | Mesmo artifact, `api-quality-findings/junit.xml` |
| E2E privado | 17 cenários e 103 passos aprovados, 0 falhas, 0 skips; 21,518 s | Mesmo workflow, artifact `e2e-isolated-reports` |
| TypeScript / isolamento Web | Typecheck aprovado; 4 testes aprovados, 0 falhas, 0 skips | Log do job E2E |
| Python Windows | 13 aprovados, 0 falhas, 0 skips; entrypoints API/E2E/carga aprovados | Artifact `python-guards-windows-latest` |
| Python macOS | 13 aprovados, 0 falhas, 0 skips; entrypoints API/E2E/carga aprovados | Artifact `python-guards-macos-latest` |
| Android Appium | 2 aprovados, 0 falhas, 0 erros, 0 skips; 70,78 s | [Mobile — PR](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/40251176449), artifact `mobile-android-poc` |

Os workflows de PR acima concluíram com `success`. Quality e mobile também passaram nos gatilhos de push: [Quality](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/40251173612) e [Mobile](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/40251173519). Não se somam testes de PR e push como se fossem cobertura adicional.

### Falha ambiental preservada e correção

No commit `0c44395`, o [mobile por push](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/40250654679) falhou nos dois testes: screenshots e hierarquias mostraram exclusivamente o alerta **Pixel Launcher isn't responding**. O alerta reapareceu após a recuperação com Wait. A [execução de PR do mesmo código](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/40250657987) passou; esse resultado não apaga a falha ambiental.

O commit `3ad8224` muda somente a preparação: quando reconhece esse alerta exato, registra evidências e aciona uma vez o botão nativo `android:id/aerr_close`, encerrando o launcher travado. Não fecha a aplicação testada, não aceita alertas genéricos nem muda as assertions. A tela Home continua obrigatória; um ANR persistente ainda provoca falha. A validação funcional posterior é a execução Android indicada acima.

### Limites da entrega

Windows/macOS comprovam testes Python e inicialização dos comandos, sem Docker Desktop ou navegador nesses hosts. A API completa e o E2E foram executados em Linux. Apple Silicon com emulação Docker e segunda origem Web não foram validados. A API foi validada localmente em dois destinos. Pagamento é demonstrativo, endereço é de cobrança e o formulário mobile grava localmente via Save. O contrato normativo do API-001 permanece sem confirmação do mantenedor.

Os artifacts têm retenção limitada e podem exigir autenticação. Consulte o [roteiro do avaliador](../evaluator-guide.md) para reproduzir os testes e gerar novos relatórios.

## Histórico — commit d40edc7

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
