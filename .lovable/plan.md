# Plano — Equipes Alien, Economia de Fichas, Loja, Mapa e S.O.S.

Sua mensagem cobre ~15 funcionalidades grandes (equipes com chat online, 30 novos destinos com 15 perguntas cada, sistema de fichas/SOS, loja com pagamentos, mapa interativo, upgrades de nave, vídeos premiados, ranking de equipes, etc.). É **muito grande para uma única entrega** — vou dividir em fases para que você veja resultado a cada passo e possa ajustar o rumo. Cada fase é independente e testável.

---

## Fase 1 — Home + Economia base de Fichas (S.O.S.)
- Adicionar **3 ícones centrais na Home**: `Disputar em Equipe`, `Loja de Fichas`, `Mapa Intergaláctico`.
- Tabela `wallets` (user_id, fichas, aneis, alimentos).
- Botão **S.O.S. resgate** (estilo da imagem LAUNCH amarelo/preto) no cabeçalho do quiz e da viagem:
  - Voltar pergunta: 10 fichas (quiz) / 20 fichas (viagem)
  - Resgate do vácuo: 30 fichas (perdeu 3 chances) / 100 fichas (resgate completo)
- Recompensa automática ao concluir quiz: ouro 75 / prata 50 / bronze 25 fichas + animação telefone tocando "Old Bells".
- Animação da **mão alienígena** (6 variantes por raça) colocando ficha no telefone.

## Fase 2 — Loja de Fichas + Vídeos
- Aba **Loja** com 4 pacotes via Stripe (PIX, cartão): 30/R$1,99 · 60/R$4,99 · 150/R$9,99 · 500/R$24,99.
- Opção **"Assista e ganhe"** — 5 fichas por vídeo (placeholder de ad SDK; integração real depende de rede de anúncios).

## Fase 3 — 30 novos destinos para Equipes
- Adicionar 30 destinos galácticos novos (planetas/sóis/estrelas/galáxias) **só visíveis na aba Equipe**.
- 15 perguntas em 3 níveis para cada um (banco temático), seguindo padrão atual.
- Singular continua com os 15 destinos atuais (cabine teletransportador intocada).

## Fase 4 — Criar/Gerenciar Equipes
- Tabelas: `teams` (nome até 16, bandeira/país, líder), `team_members` (até 50), `team_invites` (link único).
- Aba **Equipes**: ranking geral (nome, bandeira, membros, pontuação, fichas), botão "Solicitar entrada".
- Tela do líder: editar nome, adicionar/remover, copiar link de convite para baixar o app.

## Fase 5 — Batalha de Equipes online
- Sala de batalha: 5 destinos sorteados × 9 perguntas, aposta de fichas, vencedor leva o pote + 10 fichas/rodada + 1000° no ranking.
- **Chat em tempo realtime** dentro da equipe com avatares; clicar no avatar abre a identidade alien daquele membro.
- Matchmaking aleatório entre equipes.

## Fase 6 — Mapa Intergaláctico
- Tela mapa estilo "Plants vs. Zombies 2" (referência da sua imagem): 45 nós conectados, nave parada no último destino, trajeto percorrido iluminado, selos por destino.
- Duas naves no mesmo mapa: a do jogador singular e a da equipe atual.
- HUD com saldos: fichas, anéis de minhoca, 3 alimentos (líquido/salgado/doce), pontuação, selos.

## Fase 7 — Upgrades de Nave
- Loja de upgrades: motores 1→4 (sólido/líquido/H₂/plasma) a 200/500/1000/2500 fichas; cores e brilho; anéis (5 segmentos = 1 anel, 100 = troca por apetrechos).
- Perder upgrade ao errar 3× se não usar S.O.S. — imagem da nave regride.

---

## Pontos que preciso confirmar antes de codar

1. **Pagamentos reais (Stripe)** — vamos usar a integração Stripe que já existe no projeto, em modo teste primeiro? Para PIX é preciso conta Stripe Brasil ativa.
2. **Rede de anúncios em vídeo** — você tem alguma (AdMob, Unity Ads)? Sem SDK real, faço apenas um placeholder que credita 5 fichas após um timer.
3. **Chat em tempo real** — uso Supabase Realtime (recomendado, já temos backend).
4. **Áudio "Old Bells"** — posso usar um sample royalty-free ou você quer enviar um arquivo?
5. **30 novos destinos** — gero nomes/perguntas automaticamente (mistura de planetas reais + ficcionais) ou você quer fornecer a lista?
6. **Começo pela Fase 1**? É o alicerce de todo o resto (sem carteira de fichas, S.O.S./loja/aposta não funcionam).

Responda essas 6 e eu começo pela Fase 1 imediatamente.