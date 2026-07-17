# Plano — Melhorias visuais + GAME HUB "A&A Across Ages"

## 1. Botões da home (`src/routes/index.tsx`)

- **"Criar Molde 3D"** ganha cor dourada (gradiente `#e6c067 → #c9a84c → #8b6a1f`) com borda/sombra dourada, ícone `Box` dourado, mantendo o mesmo tamanho lado a lado com "Criar identidade".
- **Reorganizar os 6 botões de ação (Equipe, Fichas, Mapa, Batalha, Upgrades, Galeria) em favo de hexágono 3×3**, com o **botão central sendo o GAME HUB "A&A · Across Ages"** (novo, destacado com gradiente neon + selo "NOVO"). O botão leva para a nova rota `/gamehub`.

  Layout aproximado (cada célula é um "hex" com `clip-path: polygon` hexagonal, mantendo grid responsivo em mobile):

  ```text
  [Equipe]   [Fichas]   [Mapa]
  [Batalha]  [A&A HUB]  [Galeria]
             [Upgrades]
  ```

  Em telas estreitas, cai para grid 2 colunas mas o botão A&A HUB permanece em destaque (largura dupla).

## 2. Galeria — contadores de selos com emblemas (`src/routes/_authenticated/galeria.tsx`)

Nos totais **Bronze / Prata / Ouro**, renderizar o **`DestinationBadge` real** (imagens `badge-bronze.png`, `badge-silver.png`, `badge-gold.png`) em tamanho ~48px, com o número sobreposto no canto inferior direito num chip. Substitui os círculos coloridos genéricos atuais.

## 3. Nova rota `/gamehub` — A&A Across Ages (`src/routes/_authenticated/gamehub.tsx`)

Aba exclusiva do mini-jogo. Estrutura da tela:

- Cabeçalho: título "A&A · ACROSS AGES", HUD do piloto ativo (nave selecionada da galeria, escudos, reator).
- **Seletor de nave**: usa avatares/identidades criados pelo usuário (via `pilots.functions`); usuário escolhe qual nave pilotar.
- **Mapa de mineração** (canvas HTML 2D com fundo galáctico):
  - Nós flutuantes de 4 tipos: **Asteroide ☄️**, **Meteoro 🌠**, **Planeta 🪐**, **Constelação ✨**.
  - Nave do jogador se move com toque/arrastar (mobile-first) ou setas (desktop).
  - Ao colidir com um nó → mini-ação "minerar" (barra de progresso 1-2s) → recompensa em **fichas** (via `wallet.functions.addFichas`) e material acumulado local.
  - Nós reaparecem em posições aleatórias após minerados.
- **Painel de recursos minerados** (contadores por tipo, sessão).
- Botões: "Nova rodada", "Voltar ao painel".

Sem backend novo: reusa `wallet.functions.ts` para creditar fichas ganhas (cap de X fichas por sessão para evitar farm). Estado do jogo é local (`useState`).

## 4. Navegação (`src/routes/_authenticated.tsx`)

Adicionar link "A&A" (ícone `Gamepad2`) na barra superior, ao lado de "Pilotos".

## Arquivos

- editar `src/routes/index.tsx` — botão dourado 3D + hexágono com HUB central
- editar `src/routes/_authenticated/galeria.tsx` — contadores com emblemas reais
- editar `src/routes/_authenticated.tsx` — link nav A&A
- criar `src/routes/_authenticated/gamehub.tsx` — tela do jogo
- criar `src/components/MiningGameCanvas.tsx` — canvas do mini-jogo
- criar `src/lib/mining-game.ts` — tipos, spawn de nós, recompensas

Confirmar para eu implementar?
