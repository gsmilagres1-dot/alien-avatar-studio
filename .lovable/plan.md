## 1) Reposicionar a tarjeta (toast) apenas no Across Ages

Hoje as notificações do jogo (coleta de material, +fichas, brinde, SOS, erro de save, fase completa) usam o `<Toaster />` global do Sonner que está montado em `src/routes/__root.tsx` com `position="top-center"`. Como o jogo, em celulares em pé, é rotacionado 90° pelo CSS `.force-landscape`, o "top-center" da tela física cai na lateral da tela do jogo — visualmente por cima dos pedais/controles, e "deitado".

Correção:
- Em `src/routes/_authenticated/across-age.tsx`, montar um `<Toaster />` local **dentro** do `<div className="across-age-root force-landscape">`, com `position="top-center"` e uma `className` própria (ex.: `across-age-toaster`). Como está dentro do wrapper rotacionado, o "topo" dele já é o topo real da tela em paisagem.
- Ocultar o Toaster global só quando o jogo estiver montado: adicionar em `src/styles.css` uma regra do tipo `body:has(.across-age-root) [data-sonner-toaster]:not(.across-age-toaster){ display:none; }`, para não duplicar as tarjetas nem deixar a global aparecendo por cima.
- Ajustar o CSS do Toaster local para ficar centralizado no topo do jogo, com largura máxima confortável em paisagem e z-index acima do HUD do jogo.
- Nenhuma chamada `toast.success/error` precisa mudar — como o Sonner só tem uma fila global, o Toaster local recebe todas elas, inclusive as do `SOSButton`, brinde, mineração e "fase completa".

Escopo: só a rota `/_authenticated/across-age`. Todas as outras telas continuam usando o Toaster global normal.

## 2) Corrigir orientação das naves no Across Ages

Ajustar apenas `src/lib/ship-stats.ts` (campos `noseAngleDeg` e `flipX`) — sem tocar em física, propulsão, comandos ou renderização. Regras que o motor já usa:
- `noseAngleDeg: 0` = nariz da imagem original aponta pra direita (propulsor sai à esquerda/traseira).
- `noseAngleDeg: -90` = nariz aponta pra cima (propulsor sai embaixo, tipo foguete/drone).
- `flipX: true` = espelhar horizontalmente a imagem antes de renderizar.

Mudanças por nave:

| Nave (id) | Antes | Depois | Motivo relatado |
|---|---|---|---|
| `cadillactic-zx` | `noseAngleDeg:0` | `flipX:true` | Jato aparece no bico; imagem invertida |
| `modulo-c23` | `noseAngleDeg:0` | `flipX:true` | Jato saindo da dianteira |
| `navigator-original` | `noseAngleDeg:0` | `noseAngleDeg:-90` | Jato deve sair da base (como teleportadora) |
| `easy-rider-bus` | `flipX:true` | remover `flipX` | Ficou invertido, jato na dianteira |
| `unilander-77` | `noseAngleDeg:-90` | `noseAngleDeg:-90, flipX:true` | Farol na dianteira e inverte ao manobrar 90° |
| `cruzer-noturno` | `noseAngleDeg:0` | `noseAngleDeg:-90` | Jato é na base |
| `speed-bee-predator` | `noseAngleDeg:0` | `noseAngleDeg:-90` | Jato é na base |
| `bolha-lander` | `flipX:true` | remover `flipX` | Traseira e dianteira trocadas |
| `cruzer-aereo` | `noseAngleDeg:-90` | `noseAngleDeg:0, flipX:true` | Jato é na traseira e imagem invertida |
| `hover-coupe-rz` | `flipX:true` | remover `flipX` | Traseira/dianteira trocadas |
| `cruzador-aurun` | `flipX:true` | remover `flipX` | Dianteira/traseira invertidas |
| `supersonic-force1` | `flipX:true` | remover `flipX` | Dianteira/traseira invertidas |
| `super-duty-vanguard` | `flipX:true` | remover `flipX` | Dianteira/traseira invertidas |

Não mexer em nenhuma outra nave já corrigida anteriormente. Nada de mudança em `across-age.tsx` (render), `HangarSelect.tsx` (miniaturas) ou banco.

## Validação

- Abrir `/across-age`, disparar um SOS e coletar 1 material → confirmar que a tarjeta aparece no topo da tela em paisagem, centralizada, sem cobrir os pedais.
- Selecionar cada nave da tabela no hangar, entrar em rota curta e confirmar visualmente que o bico aponta pra direção do movimento e o propulsor sai da traseira correta.
