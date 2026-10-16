# NOCTRA PLAY — GUIA COMPLETO DE COMPILAÇÃO E INSTALAÇÃO NO ANDROID TV

## 1. Visão Geral da Arquitetura
O **NOCTRA PLAY** foi projetado especificamente para ecossistemas de TV (Android TV, TV Box, Fire TV Stick e Google TV) com:
- **Resolução Otimizada**: 1280×720 (HD), 1920×1080 (Full HD) e 3840×2160 (4K Ultra HD).
- **Margens de Segurança (Overscan)**: Respeito a 5% de margem contra cortes de borda em televisores antigos.
- **Navegação 100% por Controle Remoto**: Sem necessidade de ponteiro de mouse ou tela touch.
- **Filtro Leanback Launcher**: Aparece como aplicativo nativo na tela inicial do Android TV com banner 16:9 (`@drawable/noctra_tv_banner`).

---

## 2. Como Compilar o APK Release

### Pré-requisitos:
- Android Studio Ladybug / Meerkat ou JDK 17+
- Android SDK Platform 35 e Build-Tools 35.0.0

### Passos de Compilação via Terminal:
```bash
# 1. Navegue até a pasta do projeto Android
cd android-tv-export

# 2. Conceda permissão de execução ao Gradle Wrapper
chmod +x ./gradlew

# 3. Compilar APK em modo Release
./gradlew assembleRelease

# O APK gerado estará em:
# app/build/outputs/apk/release/app-release.apk
```

---

## 3. Como Instalar no Android TV / TV Box via Aplicativo Downloader (AFTVnews)

O método mais popular e simples para usuários finais em Smart TVs e Fire TV Stick:

1. **Ativar Fontes Desconhecidas na TV**:
   - Acesse **Configurações da TV** -> **Preferências do Dispositivo** -> **Segurança e Restrições**.
   - Habilite **Fontes Desconhecidas** para o aplicativo **Downloader**.

2. **Abrir o Aplicativo Downloader**:
   - No campo de URL ou Código Rápido, insira a URL direta do APK do NOCTRA PLAY (ou o código AFTVnews gerado no encurtador `go.aftvnews.com`).

3. **Instalação**:
   - O Downloader fará o download do arquivo `.apk` e solicitará a instalação.
   - Pressione **Instalar** e confirme com o botão **OK** do controle remoto.

4. **Confirmar no Launcher**:
   - Pressione o botão **Home** do controle da TV.
   - O ícone e banner dourado do **NOCTRA PLAY** aparecerá diretamente na fileira de aplicativos favoritos do Android TV!

---

## 4. Estrutura dos Arquivos Criados
- `AndroidManifest.xml`: Configuração de permissões, `LEANBACK_LAUNCHER`, `touchscreen=false` e banner de TV.
- `build.gradle.kts`: Configurado com Media3 / ExoPlayer 1.5.1, HLS, DASH, UI e Leanback.
- `MainActivity.kt`: Implementação com controle de D-pad, aceleração de hardware e reprodução de canais e VOD.
