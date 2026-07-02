## Escopo (sem alterar fluxo existente)

Só adiciono/ajusto o necessário. Nenhuma tela nova entra no fluxo principal sem você pedir.

### 1. Quiz atual (galáxia dos 45 destinos)
- Reduzir de 15 → **9 perguntas distintas** por destino (sorteadas do banco existente).
- Adicionar seletor de **dificuldade (Fácil / Médio / Difícil)** antes de iniciar cada viagem.
- **Sempre mostrar resposta certa e errada** imediatamente após clicar (já implementado na última rodada — vou confirmar que está funcionando de verdade antes de continuar).
- Botão SOS continua funcionando durante o quiz.

### 2. Prêmio surpresa dos 45 destinos
- Criar novo prêmio "Super Telescópio Atômico Jimmy Wath" (usar imagem estilo James Webb, padrão dos outros prêmios).
- **Oculto** na galeria — aparece como "?" / surpresa até desbloqueio.
- Desbloqueado ao completar os 45 destinos (ouro/prata/bronze da imagem 1 é referência visual dos selos existentes — não muda selos atuais).

### 3. Novo módulo: Quiz de Objetos Espaciais (NÃO entra no fluxo dos 45 destinos)
- Nova seção separada, acessível por um card na home (sem mexer em navegação existente).
- **70 itens** no mapa:
  - **30 objetos tecnológicos**: naves, foguetes, satélites, sondas, rovers reais (Voyager, Hubble, JWST, ISS, Perseverance, Curiosity, Apollo 11, SpaceX Dragon, Parker Solar Probe, New Horizons, Cassini, Juno, etc.)
  - **40 corpos celestes**: estrelas, asteroides, cometas, meteoros (Halley, Bennu, Ceres, Vesta, Sirius, Betelgeuse, Proxima Centauri, Leonidas, etc.)
- Cada item tem quiz próprio: **15 perguntas no banco, 9 sorteadas por partida**, 3 níveis de dificuldade, mínimo 70% acerto, 3 chances ou SOS. Mesmo formato do quiz atual.
- Mapa ilustrado com imagens pertinentes (mescla estilo das imagens 2 e 3 anexas — visual escuro/emblemático).

### 4. Referência das imagens anexas
- Imagem 1 (brasões ouro/prata/bronze): estilo visual dos selos já existentes — não altero.
- Imagens 2 e 3: paleta/estilo para o novo mapa de objetos espaciais.

## Ordem de execução (para não gastar créditos à toa)

Vou fazer em **fases separadas**, confirmando cada uma antes de seguir:

**Fase A** (agora): 
1. Confirmar que resposta certa/errada aparece no quiz atual (verificar código real, não confiar em edições anteriores).
2. Reduzir quiz atual para 9 perguntas.
3. Adicionar seletor de dificuldade antes da viagem.

**Fase B** (só após você aprovar A):
4. Criar imagem do telescópio Jimmy Wath.
5. Adicionar prêmio surpresa oculto dos 45 destinos.

**Fase C** (só após você aprovar B):
6. Banco de dados dos 70 objetos + 15 perguntas cada (é bastante conteúdo — vou gerar em blocos).
7. Mapa novo com imagens.
8. Fluxo do quiz reutilizando componentes existentes.

## Detalhes técnicos

- Perguntas dos novos objetos: geradas por seed determinístico + curadoria manual em blocos de 10 itens.
- Mapa novo: rota nova `/mapa-espacial`, isolada — não toca em `/galaxia` nem `/galeria`.
- Dificuldade: filtro por campo `level` já existente em `intergalactic.ts`.
- Prêmio Jimmy Wath: entry novo em `prizes` com flag `hidden: true` até condição de desbloqueio.

## Aviso honesto

Fase C é grande (70 itens × 15 perguntas = 1050 perguntas + arte do mapa). Se quiser reduzir escopo aí (ex: começar com 20 itens), me diz antes que eu executo — evita gastar crédito à toa.

Confirma se posso começar pela **Fase A**?