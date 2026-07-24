Ajustar orientação de 7 naves em `src/lib/ship-stats.ts` para corrigir frente invertida e posição do propulsor, sem alterar nenhum outro arquivo.

Mudanças:
- `corrida`: adicionar `flipX: true` (arte compartilhada precisa espelhamento).
- `aerodeslizador`: trocar `noseAngleDeg` de `-90` para `0` (perfil, propulsor na traseira), mantendo `flipX: true`.
- `vtol-classica`: trocar `noseAngleDeg` de `-90` para `0`, mantendo `flipX: true`.
- `unilander-77`: adicionar `flipX: true`.
- `cruzador-aurun`: adicionar `flipX: true`.
- `galactic-diamond`: remover `flipX: true`.
- `modal-multidimensional`: remover `flipX: true`.

Arquivo: `src/lib/ship-stats.ts`.

Nota: o usuário mencionou 6 naves no texto, mas a lista detalhada inclui 7 alterações (incluindo `corrida`). Aplicar as 7 conforme a especificação completa.