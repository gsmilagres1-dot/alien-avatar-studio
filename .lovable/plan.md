## Objetivo

Substituir o seletor de planetas pelas **6 raças alienígenas** atribuídas automaticamente a partir da data de nascimento do usuário. A foto enviada é transformada para refletir os traços da raça (mantendo o rosto reconhecível).

## As 6 raças

1. **Starseed (Semente Estelar)** — Origem Pleiadiana/Síria · Natureza Benéfica · Cura, luz, conexão espiritual
2. **Nórdico (Pleiadiano)** — Sistema das Plêiades (M45) · Benéfico · Telepatia, regeneração
3. **Grey (Zeta Reticuli)** — Neutro/Negativo · Leitura mental, abduções, interdimensional
4. **Reptiliano (Sauriano)** — Orion/Draco · Não-benéfico · Controle mental, ilusões
5. **Draconiano/Arconte** — Constelação Draco/dimensões sombrias · Hierárquico, manipulação energética
6. **Insectoide (Louva-Deus)** — Origem desconhecida · Neutra · Camuflagem, bioenergia, telepatia coletiva

## Atribuição por data de nascimento

Algoritmo determinístico: hash da data → módulo 6 → raça. A mesma data sempre gera a mesma raça (consistente, "destino cósmico"). Mostrado como descoberta, não como escolha.

## Mudanças

### `src/lib/alien.ts`
- Substituir `PLANETS` por `RACES` (6 entradas com `id`, `name`, `subtitle`, `origin`, `nature`, `powers[]`, `purpose`, `traitVisual`).
- Nova função `raceFromBirthdate(birthdate)` → retorna a raça determinística.
- `generateAlienIdentity` recebe `raceId` (ou deriva da data); campos `species`/`planetName` viram `raceName`/`origin`.
- `buildAvatarPrompt` reescrito por raça com descrição visual específica (mantis verde para Insectoide, pele escamosa para Reptiliano, crânio largo cinza para Grey, etc.) mantendo a estrutura facial do usuário enviado.

### `src/lib/identities.functions.ts`
- `draftInput` e `saveInput`: remover `planetId`, adicionar derivação automática via `raceFromBirthdate`.
- Persistir `race_id` no lugar de `planet_id` (reaproveitar a coluna existente `planet_id` para evitar migração — guardar o id da raça lá).

### `src/routes/_authenticated/criar.tsx`
- Remover seletor de planeta.
- Após o usuário informar nome + data de nascimento + gênero + foto, exibir um card "Sua origem cósmica revelada: **{Raça}**" com descrição da raça (natureza, origem, poderes, propósito) antes de gerar o avatar.
- Botão "Gerar minha forma {Raça}" dispara a IA.

### `src/routes/_authenticated/galeria.tsx` e `galaxia.tsx`
- Substituir labels `species` / `planet_id` por nome e subtítulo da raça.

### Sem mudanças de banco
- Reutilizamos colunas `planet_id` e `species` para armazenar `race_id` e `race_name`. Identidades antigas continuam funcionando (mapeamento de fallback).

## Fora de escopo
- Migração de dados antigos (identidades existentes mantêm os valores atuais).
- Mudanças no fluxo de naves, quiz, viagem ou galeria — só a parte de identidade muda.
