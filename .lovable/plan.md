# Plano — persistência de histórico via login (sem IP)

## Objetivo

Manter o fluxo atual (usuário entra e usa como anônimo), mas deixar **visível e simples** salvar a conta antes de perder o histórico ao trocar de dispositivo/limpar cache. Sem usar IP.

## Como está hoje (confirmado no código)

- `src/routes/__root.tsx` → `AuthBridge` cria sessão anônima automática via `supabase.auth.signInAnonymously()`.
- Todo histórico (identities, journeys, seals, prizes, wallet, teams, mining) é indexado por `user_id`.
- Sessão persiste no `localStorage` do navegador. Sem login "real", trocar de dispositivo = novo user_id.
- `/login` já existe com Google + e-mail/senha, mas nada no app convida o usuário a usá-lo.

## Mudanças

### 1. Habilitar Magic Link (link mágico por e-mail)

- Chamar `supabase--configure_auth` (mantém e-mail habilitado; magic link usa o mesmo canal de e-mail).
- Chamar `email_domain--check_email_domain_status`; se ainda não houver domínio de e-mail, mostrar o setup e depois scaffoldar os templates de auth (`email_domain--scaffold_auth_email_templates`) para que o link mágico chegue com a marca do app.
- Se o domínio de e-mail exigir setup do usuário (DNS), o link mágico continua funcionando pelos templates padrão do Lovable até a verificação concluir.

### 2. Ligar sessão anônima → conta (linkIdentity)

Ponto crítico para não perder o histórico já criado por quem entrou como anônimo:

- Em `/login`, antes de `signUp`/`signInWithOtp`/OAuth, se `auth.user.is_anonymous === true`, usar `supabase.auth.updateUser({ email })` (para e-mail/OTP) ou `supabase.auth.linkIdentity({ provider: 'google' })` (para Google). Isso **converte o usuário anônimo atual em uma conta permanente mantendo o mesmo `user_id`** → todos os avatares, selos, prêmios e equipes seguem juntos.
- Se o usuário não estiver anônimo (já é conta), seguir o fluxo atual (`signInWithPassword`, `signInWithOtp`, `signInWithOAuth`).

### 3. Adicionar Magic Link em `src/routes/login.tsx`

- Novo modo "Link mágico": campo de e-mail + botão "Enviar link".
- Chama `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin, shouldCreateUser: true } })` — ou `updateUser({ email })` se anônimo, para preservar histórico.
- Toast: "Enviamos um link para <e-mail>. Abra pelo mesmo dispositivo."
- Mantém Google e e-mail/senha como estão.

### 4. CTA "Salvar minha conta" visível no app

- Componente novo `SaveAccountBanner` (barra fina, dispensável):
  - Aparece apenas quando `auth.user?.is_anonymous === true` e o usuário já criou pelo menos 1 identity/seal.
  - Texto: "Salve seu progresso — sem conta o histórico pode sumir ao trocar de navegador." + botão "Salvar minha conta" → leva a `/login`.
  - Dispensável (X) com `localStorage` para não ficar chato; reaparece depois de N dias ou ao criar novos itens.
- Renderizar em `__root.tsx` (dentro de `RootComponent`, acima do `<Outlet />`) para cobrir todas as rotas autenticadas.

### 5. Menu do usuário no header (opcional, dentro do mesmo turno)

- Pequeno ícone no cabeçalho do Hub / Galeria mostrando:
  - Se anônimo: "Convidado — salvar conta" (link para `/login`).
  - Se logado: e-mail + "Sair" (`supabase.auth.signOut()` com o teardown do knowledge: `cancelQueries` + `clear` + `signOut` + `navigate('/', replace: true)`).

## Fora do escopo (deliberadamente)

- **Não** vamos registrar/identificar por IP nem fingerprint. Motivos: IP muda (4G/CGNAT/VPN), é compartilhado (Wi-Fi público, casa) → causaria colisão entre usuários e perda de histórico, além de ser dado pessoal sob LGPD.
- **Não** vamos forçar login: fluxo continua livre para anônimos como antes.
- **Não** vamos mexer em RLS/tabelas — a chave `user_id` já é a mesma antes e depois do `linkIdentity`.

## Detalhes técnicos

Arquivos alterados:
- `src/routes/login.tsx` — adicionar aba "Link mágico", lógica de `linkIdentity`/`updateUser` para sessões anônimas.
- `src/routes/__root.tsx` — montar `<SaveAccountBanner />` dentro de `RootComponent`.
- `src/components/SaveAccountBanner.tsx` (novo) — banner dispensável com CTA.
- (Opcional) `src/components/UserMenu.tsx` (novo) — ícone/menu com estado da sessão.

Backend:
- `supabase--configure_auth` (mantém e-mail; garante magic link ativo).
- `email_domain--check_email_domain_status` + `email_domain--scaffold_auth_email_templates` se o projeto ainda não tem templates de auth com a marca.

Sem mudanças de schema. Sem novas policies. Sem migração de dados.
