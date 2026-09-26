# Connect Stone

Plataforma para catálogo de rochas, empresas, vagas e controle de estoque do setor de rochas ornamentais.

## Rodar localmente

Requisitos: Node.js 22 e um projeto Supabase.

1. Copie `.env.example` para `.env.local`.
2. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. Execute `npm install`.
4. Execute `npm run dev`.

Validações disponíveis:

```bash
npm run lint
npm test
npm run build
```

## Banco e autenticação

Para uma instalação nova, execute `src/supabase_schema.sql` no SQL Editor do Supabase.

Para atualizar o banco existente, execute a migration:

`supabase/migrations/202609260001_security_hardening.sql`

Depois publique a Edge Function responsável pela criação administrativa de usuários:

```bash
supabase functions deploy admin-create-user
```

A função usa o contexto seguro fornecido por `@supabase/server`: chamadas exigem a sessão de um usuário e operações administrativas usam `ctx.supabaseAdmin` somente dentro da Edge Function. Nunca coloque uma chave `sb_secret_*` em arquivos `VITE_*` ou no navegador.

## GitHub Pages

A pasta de build não precisa ser enviada ao GitHub. O workflow `.github/workflows/deploy-pages.yml` executa as validações, gera `dist` e publica o site.

No repositório, configure estas variáveis em **Settings → Secrets and variables → Actions → Variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Em **Settings → Pages**, escolha **GitHub Actions** como fonte de publicação.

## Perfis de acesso

- `admin`: gerencia empresas, usuários, rochas, vagas e estoque.
- `empresa`: gerencia apenas dados vinculados à própria empresa.
- visitante: consulta empresas, rochas e vagas ativas.

As permissões reais ficam no Row Level Security do Supabase; esconder botões no React não é considerado controle de acesso.
