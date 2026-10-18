# Viabilidade dos testes mobile Android

Investigação realizada em 18/10/2026. Esta etapa usou documentação e código-fonte público da versão `v2.2.0` do aplicativo, além de inspeção somente de leitura do Ubuntu local. O APK não foi baixado nem executado; portanto, a exposição dos identificadores na árvore nativa do Android permanece **NÃO VERIFICADA**.

## 1. Aplicativo, licença e versão

O candidato é o [WebdriverIO Native Demo App](https://github.com/webdriverio/native-demo-app), construído com Expo e React Native para demonstração de automação. O repositório publica a licença [MIT](https://github.com/webdriverio/native-demo-app/blob/v2.2.0/LICENSE-MIT). A página de [releases](https://github.com/webdriverio/native-demo-app/releases/tag/v2.2.0) identifica `v2.2.0` como a versão mais recente consultada. A [documentação do WebdriverIO](https://webdriver.io/docs/session/targets) aponta o APK Android dessa versão em `https://github.com/webdriverio/native-demo-app/releases/download/v2.2.0/android.wdio.native.app.v2.2.0.apk` e o pacote `com.wdiodemoapp`. **NÃO VERIFICADO:** download, integridade do arquivo e instalação neste ambiente. Na implementação, fixar a versão e registrar o SHA-256 do APK obtido, sem incorporar o código-fonte do aplicativo ao monorepo.

## 2. Comportamento e cenários propostos

### Login e navegação

O [`LoginForm.validateForm`](https://github.com/webdriverio/native-demo-app/blob/v2.2.0/src/components/LoginForm.tsx) aceita um email com formato válido e uma senha de pelo menos oito caracteres. O código simula uma chamada com um temporizador e abre o alerta `Success` / `You are logged in!`; não consulta um servidor nem compara credenciais com uma conta. Portanto, **não há credenciais demonstrativas obrigatórias confirmadas e o alerta não comprova uma autenticação real**. O exemplo `alice@webdriver.io` / `supersecret` aparece na [documentação do WebdriverIO](https://webdriver.io/docs/session/targets), mas é apenas um par de entrada que satisfaz as regras locais. Para nossos testes, usar um email sintético `example.com` e senha sintética com pelo menos oito caracteres.

O [layout de abas](https://github.com/webdriverio/native-demo-app/blob/v2.2.0/app/%28tabs%29/_layout.tsx) define Login e Forms, e o [componente da barra](https://github.com/webdriverio/native-demo-app/blob/v2.2.0/src/components/CustomBottomTabBar.tsx) atribui rótulos de acessibilidade a essas abas. O cenário 1 proposto é: abrir Login, preencher os dois campos, verificar o alerta de sucesso simulado, fechá-lo, navegar para Forms e confirmar um elemento próprio dessa tela. O teste demonstrará validação local e navegação, sem alegar criação de sessão.

### Forms

Em [`FormComponents`](https://github.com/webdriverio/native-demo-app/blob/v2.2.0/src/components/FormComponents.tsx), o texto digitado aparece no campo de resultado; o switch altera um texto de estado; há um dropdown com três opções. O botão `Active` abre um alerta informando que está ativo e `Inactive` não executa ação. **Não existe submissão dos dados do formulário ou resultado persistido nesse componente.** O cenário 2 proposto é preencher o campo, conferir o eco exato do valor sintético, acionar `Active` e validar o alerta. Isso verifica uma resposta observável da interface, não o envio de um formulário. A seleção do dropdown pode ser acrescentada somente após confirmar seu comportamento no APK Android.

### Identificadores candidatos, confirmados no código da versão 2.2.0

| Tela / elemento | Identificador ou rótulo no código | Tipo pretendido no Android | Estado |
| --- | --- | --- | --- |
| Aba Login | `Login` | Accessibility ID | Confirmado no código; árvore nativa não verificada |
| Aba Forms | `Forms` | Accessibility ID | Confirmado no código; árvore nativa não verificada |
| Campo email | `input-email` | Accessibility ID | Confirmado no código; árvore nativa não verificada |
| Campo senha | `input-password` | Accessibility ID | Confirmado no código; árvore nativa não verificada |
| Botão LOGIN | `button-LOGIN` | Accessibility ID candidato | Derivado de `Button` + texto; árvore nativa não verificada |
| Tela Forms | `Forms-screen` | Accessibility ID candidato | Confirmado no código; árvore nativa não verificada |
| Campo de texto | `text-input` | Accessibility ID | Confirmado no código; árvore nativa não verificada |
| Resultado digitado | `input-text-result` | Accessibility ID | Confirmado no código; árvore nativa não verificada |
| Switch / estado | `switch` / `switch-text` | Accessibility ID | Confirmado no código; árvore nativa não verificada |
| Botão Active | `button-Active` | Accessibility ID candidato | Derivado de `Button` + texto; árvore nativa não verificada |

O helper [`testProperties`](https://github.com/webdriverio/native-demo-app/blob/v2.2.0/src/config/TestProperties.ts) converte esses identificadores em `accessibilityLabel` no Android. O [`Button`](https://github.com/webdriverio/native-demo-app/blob/v2.2.0/src/components/Button.tsx) constrói `button-${text}` e também define `accessible: false`; por isso, a disponibilidade efetiva dos botões por Accessibility ID exige inspeção em sessão Appium. Nenhum `resource-id` foi confirmado. Os alertas devem ser verificados pelos textos e controles nativos observados após a instalação, sem antecipar um seletor para eles.

## 3. Componentes disponíveis no Ubuntu local

| Componente | Resultado da inspeção |
| --- | --- |
| Java/JDK | Presente: `java` e `javac` 17.0.6; `JAVA_HOME=/usr/lib/jvm/java-17-oracle` |
| Python | Presente: 3.12.0; Pytest já consta no grupo `dev` do projeto |
| Node.js / npm | Presentes: Node 22.22.2 e npm 10.9.7, compatíveis com os [requisitos atuais do Appium](https://appium.io/docs/en/latest/quickstart/requirements/) |
| Android SDK | Não localizado nos caminhos comuns; `ANDROID_HOME` e `ANDROID_SDK_ROOT` não definidos |
| `adb`, `emulator`, `sdkmanager`, `avdmanager` | Ausentes do `PATH`; não localizados na busca limitada ao diretório pessoal |
| AVDs | Nenhum em `~/.android/avd`; ferramentas para listagem indisponíveis |
| KVM | `/dev/kvm` ausente e usuário fora do grupo `kvm`; a CPU anuncia `vmx`, mas isso **não comprova** aceleração utilizável pelo emulador |
| Appium Server / UiAutomator2 | `appium` ausente do `PATH`, sem instalação global npm ou diretório `~/.appium`; driver não instalado/localizado |
| APK v2.2.0 | Não baixado ou executado nesta etapa |

As conclusões sobre ausência se limitam a esta inspeção; instalações em caminhos não pesquisados permanecem **NÃO VERIFICADAS**. Sem SDK, emulador ou dispositivo Android conectado, não foi possível testar a aplicação nem validar os locators em runtime.

## 4. Dependências faltantes e execução local proposta

Após aprovação, obter o APK da release fixada e verificar seu SHA-256; instalar apenas os componentes necessários do Android SDK (platform-tools, emulator, uma system image e command-line tools) ou usar um dispositivo Android autorizado. Configurar `ANDROID_HOME`/`ANDROID_SDK_ROOT`, criar um AVD e conferir `adb devices` e aceleração. A [documentação do UiAutomator2](https://appium.io/docs/en/latest/quickstart/uiauto2-driver/) exige SDK Android e instalação explícita do driver. Instalar Appium Server e UiAutomator2 em versões fixadas; adicionar `Appium-Python-Client` ao lockfile Python, seguindo o [guia oficial para Python](https://appium.io/docs/en/latest/quickstart/test-py/). Nenhuma dessas instalações foi realizada agora.

A implementação mínima terá `mobile/pages/login_page.py` e `forms_page.py`, uma fixture Pytest que inicia uma sessão UiAutomator2 por teste e chama `quit()` no teardown, e dois testes independentes. Usar `WebDriverWait` e locators confirmados em runtime, sem sleeps. Em falhas, salvar screenshot com nome único em `reports/mobile/`, preservando o erro original. O futuro `make test-mobile` deverá verificar o dispositivo e o servidor Appium, executar somente `mobile/tests`, gerar `reports/mobile/report.html` e `reports/mobile/junit.xml` e preservar o código de saída do Pytest. O servidor pode ser iniciado e encerrado pelo alvo Make, enquanto o emulador é iniciado previamente; esse contrato evita instalar componentes durante o teste. As dependências Python devem entrar em grupo separado e lockfile para não alterar a regressão API.

**Critério antes de codificar testes:** instalar e iniciar o APK autorizado, inspecionar a árvore UI com Appium Inspector ou `driver.page_source`, confirmar os identificadores e o texto dos alertas na versão fixada. Se `accessible: false` impedir localizar algum botão, usar um locator nativo observado na árvore, documentando a evidência; não assumir um `resource-id` ou recorrer a coordenadas.

## 5. GitHub Actions

Há viabilidade técnica para um **job mobile separado**, sem alterar os jobs atuais: runner `ubuntu-24.04`, APK de release fixada com checksum, Java/SDK e emulador x86_64, Appium + UiAutomator2, Python + lockfile e artifacts HTML/JUnit/screenshots com `if: always()`. A [documentação de runners do GitHub](https://docs.github.com/en/actions/reference/runners/github-hosted-runners) informa suporte à aceleração de ferramentas Android nos runners Linux; o [Android Emulator Runner](https://github.com/ReactiveCircus/android-emulator-runner) documenta a instalação do SDK, criação de AVD, boot e limpeza do emulador. Isso **não comprova** que esta combinação de APK, Appium e testes passe no CI: será necessário um smoke real e confirmar permissões de KVM, tempo de boot, espaço em disco e disponibilidade do asset. O job pode ser manual primeiro para preservar o pipeline existente.

## 6. Esforço e riscos

Estimativa condicionada a um host com KVM ou dispositivo Android funcional: meio a um dia para preparar e validar SDK/AVD, APK e locators; meio a um dia para os dois Page Objects, testes e relatórios; meio a um dia adicional para provar execução no GitHub Actions. Neste Ubuntu, a ausência de `/dev/kvm` pode exigir dispositivo físico, outro host ou emulação por software mais lenta; o prazo local fica **indeterminado** até validar essa alternativa.

Riscos principais: diferença entre os identificadores do código e a árvore nativa; mudanças em releases futuras; instalação/boot do emulador no CI; dependência de download do APK; e interpretação incorreta de sucesso simulado como autenticação real ou do alerta de Forms como submissão. A versão 2.2.0 foi escolhida para uma prova de conceito no GitHub Actions; a implementação dos testes completos continua condicionada à confirmação dos locators no APK em execução.

## 7. Prova de conceito manual no GitHub Actions

O workflow experimental [`.github/workflows/mobile.yml`](../.github/workflows/mobile.yml) usa somente `workflow_dispatch` em `ubuntu-24.04`. Ele configura Java 17, verifica a presença e o acesso a `/dev/kvm`, baixa o APK da [release oficial v2.2.0](https://github.com/webdriverio/native-demo-app/releases/tag/v2.2.0), confere o SHA-256 `fe1d605ce099c73d93f33e5cbcb0df0bea437ce57aaaaf156b3b0fa1ca54931d` publicado nos [metadados da release](https://api.github.com/repos/webdriverio/native-demo-app/releases/tags/v2.2.0) e inicia um emulador Android API 35 x86_64 com `reactivecircus/android-emulator-runner@v2`. Dentro do emulador, instala o APK, consulta o pacote `com.wdiodemoapp`, inicia `com.wdiodemoapp/.MainActivity` e procura na árvore UI o identificador `Home-screen` ou o texto próprio da tela inicial, ambos presentes no [`Home.tsx` da versão 2.2.0](https://github.com/webdriverio/native-demo-app/blob/v2.2.0/src/screens/Home.tsx). Grava screenshot, hierarquia e saídas do adb em `reports/mobile/` e publica o artifact `mobile-android-poc` mesmo em falha. O checksum foi obtido da propriedade `digest` do asset Android via API oficial do GitHub; o arquivo ainda não foi baixado neste computador.

Para executar, primeiro disponibilize o arquivo do workflow na branch padrão do repositório; então abra **Actions → Mobile Android POC → Run workflow** e escolha a branch desejada. Depois, consulte o status do job `APK and emulator smoke` e baixe o artifact `mobile-android-poc`. O workflow não roda em push ou pull request, não instala o SDK no Ubuntu local e não altera o workflow `Quality`. **Nenhuma execução no GitHub foi observada até agora.** Um resultado aprovado só poderá ser informado depois que o runner completar as verificações; KVM, download, checksum, boot, instalação, atividade e hierarquia precisam ser confirmados no log e no artifact.

### Investigação dos fluxos da versão 2.2.0

| Tema | Confirmado no código-fonte | Observado no emulador |
| --- | --- | --- |
| Login | [`LoginForm`](https://github.com/webdriverio/native-demo-app/blob/v2.2.0/src/components/LoginForm.tsx) usa `input-email`, `input-password` e o botão construído como `button-LOGIN`. Valida formato de email e senha com ao menos oito caracteres. Depois simula uma chamada e exibe o alerta de sucesso; não há verificação de conta ou sessão remota. | **Pendente.** Presença real dos Accessibility IDs e aparência do alerta no Android exigem inspeção após o boot. |
| Acesso a Data Management | O [layout de abas](https://github.com/webdriverio/native-demo-app/blob/v2.2.0/app/%28tabs%29/_layout.tsx) define `data-management`. O [estado inicial da barra](https://github.com/webdriverio/native-demo-app/blob/v2.2.0/src/context/TabBarMenuContext.tsx) deixa essa aba fora dos cinco atalhos; o [menu lateral](https://github.com/webdriverio/native-demo-app/blob/v2.2.0/src/components/TabSideMenu.tsx) oferece o item `side-menu-item-data-management`. O botão Menu da barra tem rótulo `Menu`. | **Pendente.** O workflow atual comprova apenas a tela inicial; não navega até Data Management. |
| Campos e ações | [`DataManagementScreen`](https://github.com/webdriverio/native-demo-app/blob/v2.2.0/src/screens/DataManagement.tsx) publica pares de entrada, botão Save e leitura: `data-memory-input` / `button-data-memory-save` / `data-memory-readout`; `data-async-input` / `button-data-async-save` / `data-async-readout`; `data-sqlite-input` / `button-data-sqlite-save` / `data-sqlite-readout`; `data-secure-input` / `button-data-secure-save` / `data-secure-readout`. A tela usa `DataManagement-screen`. | **Pendente.** Exposição dos IDs em `content-desc`, rolagem e clique nos botões precisam ser confirmados em uma sessão Android. |
| Gravação e recuperação | `saveMemory` copia o valor para estado React; `saveAsync` e `saveSqlite` gravam em tabelas SQLite distintas; `saveSecure` grava com Expo SecureStore. Os readouts mostram o valor salvo. Ao receber foco, a tela relê SQLite e SecureStore do disco. | **Pendente.** A próxima etapa deve comparar o texto exato de entrada e readout, reiniciar o processo sem apagar dados, reabrir a tela e verificar que os valores de SQLite/SecureStore permanecem. O valor em memória deve desaparecer. |

O teste de persistência proposto deve diferenciar **reiniciar processo** de **limpar dados** ou **reinstalar**: `adb shell am force-stop com.wdiodemoapp` seguido de `am start` preserva os arquivos do aplicativo; `pm clear` e reinstalação mudam as condições do experimento. Esses resultados são expectativas derivadas do código, ainda não observações do emulador. A verificação deve usar valores sintéticos e únicos, sem credenciais reais.

### Appium na etapa seguinte

Esta prova de conceito usa adb para reduzir variáveis: **não instala nem executa Appium**. Para a futura suíte Python, o par candidato é Appium **3.7.0** com UiAutomator2 **8.7.0**. O [`package.json` do driver 8.7.0](https://github.com/appium/appium-uiautomator2-driver/blob/v8.7.0/package.json) exige Appium `^3.0.0-rc.2` e Node `^20.19.0 || ^22.12.0 || >=24.0.0`; a versão 3.7.0 consta como estável no [registro npm](https://www.npmjs.com/package/appium?activeTab=versions). Não usar UiAutomator2 9 beta com Appium 3: suas [notas de release](https://github.com/appium/appium-uiautomator2-driver/releases/tag/v9.0.0-beta.1) exigem Appium 4 beta. Compatibilidade declarada por metadados não substitui uma sessão real no runner, que segue pendente.
