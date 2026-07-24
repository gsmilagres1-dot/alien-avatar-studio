## Diagnóstico

- `src/components/HangarSelect.tsx` está truncado com **22 linhas** (para na linha `import raceAnunna`) — é isso que quebra o build (`Expected "from" but found end of file`) e trava a prévia.
- `src/routes/_authenticated/across-age.tsx` tem **1208 linhas** — está íntegro, não foi cortado.
- No histórico do git, o commit imediatamente anterior ao truncamento é **`a5bd271` ("Update HangarSelect.tsx")** com **417 linhas**. Inspecionando esse commit, ele **já contém exatamente as duas mudanças pedidas**:
  - `shipThumbTransform` já usa `getShipStats(id).flipX` (sem `NEEDS_MIRROR`).
  - `UNLOCK_ALL_SHIPS_FOR_TESTING` já existe e `unlockedShipSet` já faz o `new Set(EXTRA_SHIPS.map((s) => s.id))` quando true.

Ou seja: basta restaurar o arquivo dessa revisão — nenhuma edição adicional necessária.

## Passos

1. Restaurar `src/components/HangarSelect.tsx` a partir do commit `a5bd271` via `git show a5bd271:src/components/HangarSelect.tsx > src/components/HangarSelect.tsx`.
2. Conferir que o arquivo voltou com 417 linhas e que contém `UNLOCK_ALL_SHIPS_FOR_TESTING`, `shipThumbTransform` usando `flipX`, e não contém `NEEDS_MIRROR`.
3. Deixar o build/typecheck rodar para confirmar que o erro `Expected "from"` sumiu e a prévia volta a atualizar.

Nenhum outro arquivo é tocado. `across-age.tsx` permanece como está.
