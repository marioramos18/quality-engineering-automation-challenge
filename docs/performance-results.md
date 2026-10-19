# Resultados de performance da API mock

## Objetivo e configuração

O experimento exercita uma API mock local com o executor `constant-vus` do k6. O perfil completo configura 500 usuários virtuais (VUs) por 5 minutos; o smoke anterior configurou 10 VUs por 15 segundos. Em cada iteração há uma requisição, distribuída em 80% GET e 20% POST, seguida de `sleep(1)`. O teste verifica status HTTP e conteúdo essencial das respostas.

Os números abaixo vêm dos resumos gerados pelas execuções. Uma cópia do [resumo da carga completa](evidence/k6-load-summary.json) está versionada para consulta dos avaliadores. Os arquivos originais `reports/performance/load-summary.json` e `reports/performance/smoke-summary.json` são gerados localmente e ficam fora do versionamento; os comandos ao fim do documento permitem recriá-los.

## Ambiente e limitações

O k6 e a API mock Node.js rodam em containers Docker na mesma máquina e se comunicam por uma rede interna do Compose. Assim, gerador e servidor disputam recursos do host. O resumo não registra uso de CPU, memória ou limites efetivos dos containers. Além disso, o `sleep(1)` controla a frequência das iterações e influencia diretamente a vazão. O resultado não é um benchmark de produção e não determina a capacidade máxima do servidor.

## Comparação das execuções

| Métrica | Smoke | Carga completa |
| --- | ---: | ---: |
| Executor | `constant-vus` | `constant-vus` |
| VUs configurados / alcançados | 10 / 10 | 500 / 500 |
| Duração configurada | 15 s | 5 min |
| Requisições totais | 150 | 150.000 |
| GET / POST | 120 / 30 | 120.000 / 30.000 |
| Vazão média | 9,98 req/s | 498,61 req/s |
| Latência média | 1,59 ms | 1,58 ms |
| Latência p90 | 2,34 ms | 2,56 ms |
| Latência p95 | 5,19 ms | 3,77 ms |
| Latência p99 | 10,31 ms | 11,16 ms |
| Erros HTTP | 0% | 0% |
| Erros de contrato | 0% | 0% |
| Iterações | 150 | 150.000 |
| Thresholds | 3 aprovados | 3 aprovados |

## Análise de vazão, latência e erros

Com 50 vezes mais VUs configurados, a vazão média passou de 9,98 para 498,61 req/s, aproximadamente 50 vezes maior. Essa proximidade é coerente com o intervalo de 1 segundo entre iterações; ela não demonstra que o servidor atingiu seu limite. A proporção observada de GET e POST foi de 80% e 20% nas duas execuções.

A latência média ficou próxima de 1,6 ms em ambos os perfis. Na carga completa, p90 foi 2,56 ms, p95 foi 3,77 ms e p99 foi 11,16 ms. Em comparação com o smoke, p95 caiu e p99 subiu ligeiramente. Esses agregados, obtidos em uma execução por perfil, não estabelecem tendência nem explicam a variação. As taxas registradas de erros HTTP e de contrato foram 0% nas duas execuções.

## Avaliação dos thresholds

Os três critérios passaram no perfil completo e no smoke:

| Critério k6 | Resultado na carga completa |
| --- | --- |
| `http_req_failed: rate<0.01` | Aprovado; taxa observada de 0% |
| `contract_errors: rate<0.01` | Aprovado; taxa observada de 0% |
| `http_req_duration: p(95)<500` | Aprovado; p95 observado de 3,77 ms |

Esses limites são critérios de referência para a API mock, não SLAs de um sistema real.

## Gargalos e hipóteses

Os resumos não evidenciam um gargalo do servidor no perfil testado: os erros foram 0% e os thresholds passaram. O intervalo deliberado de 1 segundo limita a taxa de requisições produzida pelo cenário. Disputa por CPU ou memória entre containers, agendamento do Docker, event loop do Node.js e rede local são possíveis influências, mas não foram medidas; portanto, não são causas comprovadas. Para investigar saturação, seriam necessários dados de recursos e um experimento específico, com outro padrão de chegada de requisições.

## Conclusão e reprodução

No perfil completo, o k6 alcançou os 500 VUs configurados, registrou 150.000 requisições e 150.000 iterações, sem erros HTTP ou de contrato, e aprovou os três thresholds. Isso comprova apenas o comportamento observado desta API mock e deste cenário na máquina compartilhada de teste; não estabelece desempenho de produção nem capacidade máxima.

Para reproduzir o perfil completo, execute na raiz do repositório:

```bash
make test-load
```

O resumo é gravado em `reports/performance/load-summary.json` e a saída legível em `reports/performance/load-summary.txt`. Para repetir o smoke, execute `make test-load-smoke`.
