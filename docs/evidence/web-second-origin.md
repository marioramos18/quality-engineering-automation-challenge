# E2E Web em segunda origem — 28/10/2026

Código: commit `c35066b`. A mesma implementação de Page Objects, steps e configuração usada na instalação privada foi executada com `WEB_BASE_URL=https://practicesoftwaretesting.com`, sem alterações no código. A imagem `quality-web-second-origin:c35066b` foi construída a partir desse commit e de `web/Dockerfile`. O Chromium rodou nela, pois o Playwright instalado no host não oferece o navegador para este Ubuntu 20.04.

| Origem e seleção | Resultado observado | Evidência local |
| --- | --- | --- |
| Toolshop privado descartável, suíte completa | 17 cenários e 103 passos aprovados; 0 falhas e 0 skips | `reports/e2e-isolated/e2e-report.html` e `junit.xml` |
| Serviço público, `@checkout-safe or @login or @account-navigation or @login-validation` | 10 cenários aprovados e 2 falhas de login positivo; 0 skips | `reports/e2e-public-review/e2e-report.html` e `junit.xml` |
| Serviço público, `@checkout-safe or @login-validation` | 10 cenários e 57 passos aprovados; 0 falhas e 0 skips | `reports/e2e-public-safe/e2e-report.html` e `junit.xml` |

Os dois logins positivos no serviço público foram rejeitados com a mensagem `Account locked, too many failed attempts. Please contact the administrator.` A conta é compartilhada; não houve nova tentativa de autenticação depois desse resultado. A seleção limpa não inclui login, login negativo nem criação de pedidos. Ela comprova carrinho, checkout até pagamento e validação de campos em uma segunda origem, mas **não comprova login positivo nessa origem nem a suíte completa fora do ambiente privado**.

Comandos da seleção limpa, executados na raiz do repositório:

```text
docker build -t quality-web-second-origin:c35066b web
docker run --rm --user 1001:1001 -e WEB_BASE_URL=https://practicesoftwaretesting.com -e E2E_REPORT_DIR=/workspace/reports/e2e-public-safe -v /home/mes/projects/quality-engineering-automation-challenge/reports:/workspace/reports quality-web-second-origin:c35066b npm test -- --tags '@checkout-safe or @login-validation'
```

O caminho montado e o UID/GID `1001:1001` são específicos desta máquina. Para reproduzir em outro host, ajuste o caminho da pasta de relatórios e o usuário do container; use os mesmos valores de `WEB_BASE_URL` e tags. Os relatórios em `reports/` são ignorados pelo Git e ficam disponíveis nesta cópia local; esta página registra os números e a limitação sem apresentar a tentativa de 12 cenários como aprovada.
