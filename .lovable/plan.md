## Plano

Editar **apenas** `src/lib/ship-stats.ts` nas 6 linhas especificadas, sem tocar em outras naves ou arquivos.

### Mudanças a aplicar

1. **`corrida`** (linha 63) — garantir `flipX: true`:
   ```ts
   corrida: { category: "leve", fuelMult: 1.10, o2Mult: 1.05, cargoMult: 0.85, speedMult: 1.20, blurb: "Rápida, carga baixa", noseAngleDeg: 0, flipX: true },
   ```

2. **`aerodeslizador`** (linha 69) — `noseAngleDeg: -90 → 0`, manter `flipX: true`:
   ```ts
   aerodeslizador: { category: "medio", fuelMult: 1.05, o2Mult: 1.00, cargoMult: 1.00, speedMult: 1.05, blurb: "Equilibrada", noseAngleDeg: 0, flipX: true },
   ```

3. **`unilander-77`** (linha 94) — adicionar `flipX: true`:
   ```ts
   "unilander-77": { category: "micro", fuelMult: 1.38, o2Mult: 1.28, cargoMult: 0.55, speedMult: 1.28, blurb: "Moto voadora, autonomia enorme", noseAngleDeg: -90, flipX: true },
   ```

4. **`cruzador-aurun`** (linha 103) — adicionar `flipX: true`:
   ```ts
   "cruzador-aurun": { category: "medio", fuelMult: 1.00, o2Mult: 1.00, cargoMult: 1.05, speedMult: 0.95, blurb: "Cruzador robusto e equilibrado", noseAngleDeg: 0, flipX: true },
   ```

5. **`galactic-diamond`** (linha 105) — remover `flipX: true`:
   ```ts
   "galactic-diamond": { category: "leve", fuelMult: 1.12, o2Mult: 1.08, cargoMult: 0.85, speedMult: 1.20, blurb: "Angular e rápida", noseAngleDeg: 0 },
   ```

6. **`modal-multidimensional`** (linha 106) — remover `flipX: true`:
   ```ts
   "modal-multidimensional": { category: "medio", fuelMult: 0.98, o2Mult: 1.00, cargoMult: 1.10, speedMult: 1.00, blurb: "Tecnologia densa, carga extra", noseAngleDeg: 0 },
   ```

7. **`vtol-classica`** (linha 70) — garantir `noseAngleDeg: 0` e `flipX: true`:
   ```ts
   "vtol-classica": { category: "medio", fuelMult: 1.00, o2Mult: 1.00, cargoMult: 1.05, speedMult: 0.95, blurb: "Estável, carga um pouco maior", noseAngleDeg: 0, flipX: true },
   ```

## Validação

- Rodar `lovable exec build` para confirmar que não há erro de sintaxe.
- Nenhum outro arquivo será modificado.
