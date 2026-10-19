# Viabilidade e resultado dos testes mobile Android

## Aplicativo e escopo

O aplicativo é o [WebdriverIO Native Demo App v2.2.0](https://github.com/webdriverio/native-demo-app/releases/tag/v2.2.0), disponibilizado sob [licença MIT](https://github.com/webdriverio/native-demo-app/blob/v2.2.0/LICENSE-MIT). O workflow baixa o APK oficial, confere seu SHA-256 e instala o pacote `com.wdiodemoapp` no emulador. O código-fonte do aplicativo não foi incorporado a este repositório.

Foram implementados dois testes em `mobile/tests/`, com Page Objects em `mobile/pages/` e uma sessão Appium independente por teste:

1. Login demonstrativo com email e senha sintéticos, verificação do alerta de sucesso e navegação até Forms. O [formulário de login da versão 2.2.0](https://github.com/webdriverio/native-demo-app/blob/v2.2.0/src/components/LoginForm.tsx) simula o sucesso após validar o formato dos campos; **não autentica em backend**.
2. Gravação de um valor sintético único em Data Management, comparação com o valor apresentado, reinício do processo do aplicativo e nova comparação com o valor recuperado. O teste usa `terminate_app` e `activate_app` na mesma sessão, sem limpar os dados do aplicativo. A persistência validada é local, não uma gravação em serviço externo.

Os locators usados incluem Accessibility IDs de Login, Forms, Menu e Data Management, além de seletores nativos para os botões. A execução funcional no emulador confirmou que os seletores necessários a esses dois fluxos funcionaram com o APK fixado. Essa confirmação não se estende a outras versões do aplicativo ou a campos e fluxos não cobertos.

## Resultado comprovado no GitHub Actions

A execução **Mobile Android POC #7** passou em um runner `ubuntu-24.04` com emulador Android API 35 x86_64, APK v2.2.0, Appium 3.7.0, UiAutomator2 8.7.0, Python 3.12 e Pytest:

| Medida | Resultado |
| --- | --- |
| Testes | **2 PASSED, 0 FAILED, 0 ERROR, 0 SKIPPED** |
| Tempo dos testes Pytest | **86,48 segundos** |
| Tempo total do job | **aproximadamente 3 minutos e 56 segundos** |
| Cenário 1 | Login simulado e navegação para Forms aprovados |
| Cenário 2 | Gravação e recuperação local após reinício do aplicativo aprovadas |
| Relatórios | HTML e JUnit XML publicados no artifact |

A POC #6 já havia confirmado KVM, inicialização do emulador, instalação do APK e abertura da tela Home. A execução #7 acrescentou a validação dos dois testes funcionais. São resultados dessas execuções específicas; não garantem estabilidade em todos os runners.

## Ambiente local e dependências

Na inspeção inicial do Ubuntu local havia Java 17, Python 3.12 e Node.js 22, mas não foram encontrados Android SDK, `adb`, emulador, AVD, `/dev/kvm`, Appium ou UiAutomator2. Nenhum SDK Android foi instalado nessa máquina. Para reproduzir localmente, seria necessário fornecer um emulador ou dispositivo Android autorizado, o APK v2.2.0 verificado, Appium 3.7.0, UiAutomator2 8.7.0 e as dependências Python do grupo `mobile` em `uv.lock`. A execução no GitHub Actions evita essa instalação local.

O [workflow mobile](../.github/workflows/mobile.yml) usa `ubuntu-24.04`, Java 17, Node.js 22.22.2, Python 3.12 e Android API 35. Ele verifica o acesso a KVM, baixa o APK da release oficial e confere o SHA-256 `fe1d605ce099c73d93f33e5cbcb0df0bea437ce57aaaaf156b3b0fa1ca54931d`. O `reactivecircus/android-emulator-runner@v2` inicia o emulador e executa `.github/scripts/mobile-ci.sh` enquanto ele está ativo. Esse script roda a verificação de abertura do aplicativo, inicia e aguarda o Appium, executa Pytest e preserva seu código de saída ao encerrar o servidor.

## Execução automática, manual e evidências

O workflow **Mobile Android Tests** está configurado para `push` na branch `main`, `pull_request` com destino à `main` e `workflow_dispatch`. Para iniciar manualmente, abra **Actions → Mobile Android Tests → Run workflow** e selecione a branch. Ele permanece separado de `quality.yml`. A [execução automática por `push` na `main`](https://github.com/marioramos18/quality-engineering-automation-challenge/actions/runs/39184912606) concluiu com **2 testes PASSED** e upload das evidências. O gatilho de `pull_request` ainda não foi comprovado por uma execução observada.

Em **Actions**, abra a execução e baixe o artifact `mobile-android-poc` na seção **Artifacts**. Os relatórios ficam em `reports/mobile/report.html` e `reports/mobile/junit.xml`. O diretório também contém, quando gerados, `pytest.log`, `appium.log`, screenshots, hierarquias XML e logs Android. O upload usa `if: always()`, inclusive quando o teste falha; arquivos que dependem de uma etapa não iniciada podem não existir. O HTML pode ser aberto no navegador; o XML pode ser lido por um visualizador JUnit.

## Limitações e riscos

- O login comprova somente a validação e o alerta simulados pelo aplicativo, sem conta ou sessão remota.
- A gravação foi comprovada após reinício do processo na mesma instalação do APK. O teste não mede persistência após desinstalação, limpeza de dados ou troca de dispositivo.
- O boot e a estabilidade do emulador dependem de KVM, recursos e imagens disponíveis no runner. A POC tratou uma janela de ANR do Pixel Launcher com evidências e uma única tentativa controlada; ocorrências futuras ainda podem falhar.
- O download da release e o comportamento do APK podem mudar fora da versão fixada. Erros ambientais devem ser analisados com screenshots, hierarquias e logs antes de serem atribuídos ao aplicativo.
- A duração de aproximadamente 3 minutos e 56 segundos foi observada na execução #7; outras execuções podem variar.
