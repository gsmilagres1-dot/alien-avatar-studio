# Plano — Expansão de Quiz, Prêmios e Mapa Estelar

Nada do fluxo atual do app será alterado. Tudo é aditivo: novas telas, novas rotas e novos parâmetros nos quizzes já existentes, mantendo compatibilidade com viagens em andamento.

---

## 1. Quiz — 9 perguntas + 3 níveis de dificuldade

**Antes de iniciar cada quiz** (nas 45 viagens atuais e nas novas), o usuário escolhe um dos 3 níveis: **Fácil / Médio / Difícil**.

- Quiz passa de 15 → **9 perguntas distintas**, sorteadas do banco daquele destino, filtradas pelo nível escolhido.
- Regra de aprovação mantida: **≥ 70% de acerto (mínimo 7/9)**, **3 chances**, e o **SOS** já existente continua valendo para "voltar pergunta".
- **Feedback visual imediato** por pergunta: após responder, a alternativa correta fica em verde e a errada em vermelho, com botão "Próxima". Assim o usuário vê claramente quando errou e pode acionar o **SOS S.O.S. VOLTAR PERGUNTA** antes de avançar.
- Selos Ouro / Prata / Bronze são recalculados sobre o novo total (9): Bronze 70–79%, Prata 80–90%, Ouro 91–100%.

## 2. Prêmio final dos 45 destinos — Telescópio "Jimmy Wath"

Ao completar os **45 selos (visitas com quiz aprovado)**, o viajante desbloqueia um novo prêmio exclusivo:

- **Telescópio Atômico Jimmy Wath** — brasão/emblema no mesmo estilo heráldico das imagens de referência (águia, coroa, escudo, listras — preto e prata).
- Fica **oculto** (silhueta + "?" + contador "X / 45 selos") na Galeria até ser conquistado.
- Ao completar, aparece uma cerimônia de entrega (modal com brasão animado) e o item entra permanentemente no perfil.
- O telescópio é a **chave de entrada** para o novo módulo (Asteroides / Naves) — quem não tem, vê a área bloqueada com CTA "Complete os 45 destinos".

## 3. Novo módulo — Quizzes de Asteroides, Cometas, Meteoros, Naves e Satélites

Mesma mecânica do quiz atual, mas com bancos temáticos novos:

- **9 perguntas por desafio**, sorteadas de banco de 15+ perguntas distintas por objeto.
- **3 níveis** escolhidos antes de iniciar.
- **≥ 70%**, **3 chances**, SOS habilitado.
- Recompensa em fichas idêntica à atual (Ouro 75 / Prata 50 / Bronze 25).
- Nova rota `/desafios-cosmicos` (só desbloqueia com o Telescópio Jimmy Wath).

## 4. Novo Mapa Estelar Ampliado

Rota nova `/mapa-estelar` (não substitui o `/mapa` atual). Baseado visualmente nas imagens 2 e 3 anexas (grid de tipos de estrela + mapa de galáxias com labels NGC/HD/UGC):

- **30 objetos tecnológicos** — sondas, naves, foguetes, satélites e rovers reais (Voyager 1/2, Cassini, JWST, Hubble, ISS, Perseverance, Curiosity, New Horizons, Parker Solar Probe, Juno, Kepler, Chang'e, Rosetta, Philae, Pioneer 10/11, Galileo, Mars Odyssey, MRO, MAVEN, Tianwen-1, Ingenuity, Spirit, Opportunity, Sojourner, Luna 2, Apollo 11 LM, Soyuz, SpaceX Dragon, Starlink).
- **40 corpos celestes** — estrelas (Sol, Sirius, Betelgeuse, Rigel, Vega, Polaris, Proxima Centauri, Alpha Centauri A/B, Antares, Aldebaran, Arcturus, Canopus, Deneb, Altair, VY Canis Majoris, ana vermelha/laranja/amarela/branca/azul/marrom, sub-anã, gigante azul/vermelha, supergigante azul/vermelha, hipergigante, Wolf-Rayet, estrela de nêutrons, pulsar, magnetar, buraco negro, estrela de quark), + asteroides (Ceres, Vesta, Pallas, Bennu, Ryugu, Apophis), cometas (Halley, Hale-Bopp, NEOWISE), meteoros (Perseidas, Leônidas).
- Cada card tem imagem ilustrativa (geradas via `imagegen` no estilo das referências) + botão "Iniciar quiz" que abre o quiz do módulo novo.
- Layout: grid tipo mapa estelar com fundo cósmico e labels sutis (padrão da imagem 3).

## 5. Detalhes técnicos

- `src/lib/intergalactic.ts`: `QUESTIONS_PER_QUIZ` 15 → 9, novo tipo `Difficulty = "easy"|"medium"|"hard"`, `QUESTIONS_PER_LEVEL` 5 → 3.
- `src/lib/intergalactic-questions.ts` e `team-destinations.ts`: cada pergunta ganha `difficulty`. Sorteio filtra por nível.
- `startQuiz` / `submitQuiz`: aceitam `difficulty` como novo campo; seed inclui difficulty para variar o pool.
- Componente `<QuizAnswerFeedback>` novo, injetado no fluxo do quiz atual, mostra verde/vermelho + libera SOS.
- Novo módulo em `src/lib/cosmic.functions.ts` + `src/lib/cosmic-questions.ts` + rota `_authenticated/desafios-cosmicos.tsx`.
- Galeria: card "Telescópio Jimmy Wath" com estado oculto/desbloqueado; verificação via query em `visas` (count = 45).
- Migração: nova tabela `cosmic_attempts` (mesma forma de `quiz_attempts`) e coluna `unlocked_telescope` no perfil (ou derivada por count).
- Imagens: 1 brasão do telescópio (estilo heráldico preto/prata) + 70 miniaturas ilustrativas para o mapa (geradas em lote, salvas via `lovable-assets`).

## 6. Ordem de execução

1. Migração DB + tipos.
2. Ajuste do quiz existente (9 perguntas + níveis + feedback visual).
3. Brasão Jimmy Wath + card oculto na Galeria + contador.
4. Bancos novos (asteroides / naves / satélites / cometas / meteoros).
5. Rota `/desafios-cosmicos` reaproveitando o componente de quiz.
6. Rota `/mapa-estelar` com 70 cards ilustrados.
7. QA visual em cada etapa.

---

Confirma este plano ou quer ajustar algum ponto (ex.: número de perguntas, quais objetos entram no mapa, se o telescópio deve dar fichas bônus, etc.)?