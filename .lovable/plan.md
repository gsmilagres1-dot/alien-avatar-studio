Implementar emblemas metálicos de bronze/prata/ouro conforme a performance no quiz de cada destino.

Mudanças:
1. Banco de dados: adicionar coluna `tier` (texto) na tabela `visas` para armazenar bronze, silver ou gold de cada visto conquistado.
2. Componente `DestinationBadge`: aceitar prop `tier` e aplicar paletas de metal bronze/prata/ouro sobre as formas existentes (sol, planeta, lua). Se `tier` não for informado, manter cores por tipo de destino como fallback.
3. Regras de tier por score (15 perguntas):
   - 70% a 79% → bronze
   - 80% a 90% → prata
   - 91% a 100% → ouro
4. `submitQuiz` (server function): retornar `tier` além de `passed`/`score`.
5. `claimVisa` (server function): receber e gravar `tier` no visto.
6. Tela `/galaxia`: ao aprovar no quiz, exibir o emblema correspondente ao tier, passar tier para `claimVisa` e mostrar selo dourado/prateado/bronzeado no painel de destinos conquistados.
7. Tela `/galeria`: exibir os vistos com o tier salvo.
8. `gallery.functions.ts`: incluir coluna `tier` na listagem de vistos.
9. Tipos do Supabase: atualizar `src/integrations/supabase/types.ts` com a nova coluna.