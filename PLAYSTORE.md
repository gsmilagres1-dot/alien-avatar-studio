# Publicação Google Play Store — Identidade Alien

## 1. Estratégia recomendada: TWA (Trusted Web Activity)

Como o app hoje é uma web app publicada em `alien-avatar-studio.lovable.app`,
o caminho **mais rápido e barato** para colocar na Play Store é empacotar como
**TWA (Trusted Web Activity)** — o Android abre a URL publicada em tela cheia,
sem barra do navegador, com ícone próprio e splash. É o método que o Google
recomenda para PWAs.

Ferramenta oficial gratuita: **Bubblewrap CLI**
https://github.com/GoogleChromeLabs/bubblewrap

Alternativa gráfica (sem terminal): **PWABuilder** — https://www.pwabuilder.com/

Se depois precisar de câmera nativa, notificações push com FCM, compras
in-app do Google Play etc., migra para **Capacitor**.

---

## 2. Pré-requisitos antes de empacotar

### 2.1 Domínio + HTTPS
- [x] Já tem: `https://alien-avatar-studio.lovable.app`
- Ideal: domínio próprio (ex: `identidadealien.com.br`). Mais confiança na loja.

### 2.2 manifest.webmanifest (já existe em `public/`)
Verificar / ajustar estes campos:
```json
{
  "name": "Identidade Alien",
  "short_name": "Alien",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000010",
  "theme_color": "#00ffcc",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 2.3 Digital Asset Links (obrigatório para TWA)
Precisa hospedar `/.well-known/assetlinks.json` no domínio publicado
apontando para o **fingerprint SHA-256** da chave de assinatura do app.
O Bubblewrap gera o arquivo automaticamente após criar o keystore.

---

## 3. Assets necessários para a ficha da Play Store

| Item | Formato | Tamanho | Obrigatório |
|---|---|---|---|
| Ícone do app | PNG 32-bit | 512×512 | ✅ |
| Feature graphic (banner) | PNG/JPG | 1024×500 | ✅ |
| Screenshots celular | PNG/JPG | mín 320px, máx 3840px, aspect 16:9 ou 9:16 | ✅ 2 a 8 |
| Screenshots tablet (7 e 10") | PNG/JPG | proporcional | opcional (recomendado) |
| Vídeo promocional (YouTube) | link | — | opcional |
| Ícone adaptativo (maskable) | PNG | 512×512 com safe zone | ✅ para PWA |

**Todos os assets ficam prontos para geração via Lovable image gen quando você pedir.**

---

## 4. Textos da ficha (Play Console)

- **Nome do app** (30 chars): `Identidade Alien`
- **Descrição curta** (80 chars):
  `Gere sua identidade alienígena, viaje pela galáxia e forme equipes.`
- **Descrição completa** (até 4000 chars): destacar
  - Criação de avatar alien com IA
  - Galeria de identidades + passaporte galáctico
  - Batalhas-quiz em equipe apostando fichas
  - Loja de fichas e upgrades de nave
  - Mapa de destinos + intergaláctico
- **Categoria**: Entretenimento (ou Casual → Jogos)
- **Classificação de conteúdo**: preencher questionário (IARC) — provavelmente `Livre` ou `10+`
- **Política de privacidade**: URL pública obrigatória (criar página `/privacidade`)
- **Email de contato do desenvolvedor**
- **Público-alvo**: 13+ (usa contas e pagamentos)

---

## 5. Passos com Bubblewrap (linha de comando)

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest=https://alien-avatar-studio.lovable.app/manifest.webmanifest
# responder as perguntas: package id (ex.: br.com.identidadealien.app), nome, cor, etc.
bubblewrap build
```

Saídas:
- `app-release-signed.aab` → é o arquivo que você faz upload na Play Console
- `assetlinks.json` → hospedar em `/.well-known/assetlinks.json` no site
- `.keystore` → **GUARDAR EM LOCAL SEGURO** (perder = perder o app)

---

## 6. Passos na Google Play Console

1. Criar conta de desenvolvedor: **US$ 25** (pagamento único).
2. Criar app → "Criar aplicativo".
3. Preencher: idioma padrão, nome, gratuito/pago.
4. Preencher **política de privacidade**, **classificação de conteúdo** e **público-alvo** (obrigatório).
5. Upload dos assets (ícone, banner, screenshots).
6. Enviar `.aab` na aba **Produção → Criar novo lançamento**.
7. Aguardar revisão (normalmente 1-3 dias na primeira submissão).

---

## 7. Checklist final antes do envio

- [ ] Ícones 192/512 e maskable em `public/icons/` ✅
- [ ] `manifest.webmanifest` com `display: standalone` ✅
- [ ] Página `/privacidade` publicada
- [ ] Página `/termos` publicada (recomendado)
- [ ] `assetlinks.json` publicado em `.well-known/`
- [ ] Screenshots 9:16 (celular) prontos — 2 a 8
- [ ] Banner 1024×500 pronto
- [ ] Descrição curta + longa em pt-BR
- [ ] Conta Google Play Developer paga
- [ ] Keystore salvo com backup

---

## 8. Depois do lançamento

- Atualizações da web (Lovable "Update") **são automáticas para o app TWA** — o
  Android sempre carrega a versão publicada; só precisa gerar novo `.aab` se
  mudar ícones/manifesto.
- Se quiser AdMob (rewarded ads) ou push notifications futuramente, migrar
  para Capacitor. O TWA não expõe SDKs nativos.
