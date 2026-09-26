-- ============================================================
--  CONNECT STONE — Supabase Schema
--  Cole este script no Supabase SQL Editor e execute
-- ============================================================

-- ── Extensões ────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
--  TABELAS
-- ============================================================

-- ── Empresas ─────────────────────────────────────────────────
create table if not exists public.empresas (
  id          uuid primary key default uuid_generate_v4(),
  nome        text not null,
  endereco    text,
  telefone    text,
  cnpj        text,
  criado_em   timestamptz default now()
);

-- ── Perfis de usuário (espelha auth.users) ───────────────────
-- role: 'admin' | 'empresa'
create table if not exists public.usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('admin','empresa')),
  empresa_id  uuid references public.empresas(id) on delete set null,
  criado_em   timestamptz default now()
);

-- ── Rochas ───────────────────────────────────────────────────
create table if not exists public.rochas (
  id           uuid primary key default uuid_generate_v4(),
  empresa_id   uuid not null references public.empresas(id) on delete cascade,
  nome         text not null,
  tipo         text,
  acabamento   text,
  estoque_m2   numeric default 0,        -- campo único e padronizado
  foto_url     text,
  criado_por   uuid references auth.users(id) on delete set null,
  criado_em    timestamptz default now()
);

-- Índice para buscas por empresa
create index if not exists rochas_empresa_id_idx on public.rochas(empresa_id);
-- Unicidade: nome por empresa
create unique index if not exists rochas_nome_empresa_idx on public.rochas(empresa_id, nome);

-- ── Movimentações de estoque ──────────────────────────────────
create table if not exists public.movimentacoes (
  id          uuid primary key default uuid_generate_v4(),
  rocha_id    uuid not null references public.rochas(id) on delete cascade,
  tipo        text not null check (tipo in ('entrada','saida')),
  m2          numeric not null check (m2 > 0),
  obs         text,
  user_id     uuid references auth.users(id) on delete set null,
  criado_em   timestamptz default now()
);

create index if not exists mov_rocha_id_idx on public.movimentacoes(rocha_id);

-- ── Vagas ────────────────────────────────────────────────────
create table if not exists public.vagas (
  id             uuid primary key default uuid_generate_v4(),
  empresa_id     uuid not null references public.empresas(id) on delete cascade,
  cargo          text not null,
  descricao      text,
  contato_email  text,
  ativa          boolean default true,
  publicada_em   timestamptz default now()
);

create index if not exists vagas_empresa_id_idx on public.vagas(empresa_id);

-- ── Avisos ───────────────────────────────────────────────────
create table if not exists public.avisos (
  id           uuid primary key default uuid_generate_v4(),
  titulo       text not null,
  mensagem     text,
  publicado_em timestamptz default now()
);

-- ============================================================
--  FUNÇÃO AUXILIAR: pega o perfil do usuário logado
-- ============================================================
create or replace function public.get_my_profile()
returns public.usuarios
language sql security definer stable set search_path = ''
as $$
  select * from public.usuarios where id = auth.uid();
$$;

-- ============================================================
--  ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.empresas     enable row level security;
alter table public.usuarios     enable row level security;
alter table public.rochas       enable row level security;
alter table public.movimentacoes enable row level security;
alter table public.vagas        enable row level security;
alter table public.avisos       enable row level security;

-- ── Helpers de role ──────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.my_empresa_id()
returns uuid language sql security definer stable set search_path = '' as $$
  select empresa_id from public.usuarios where id = auth.uid();
$$;

-- ────────────────────────────────────────────────────────────
--  EMPRESAS
-- ────────────────────────────────────────────────────────────
-- Qualquer um pode ver empresas (marketplace público)
create policy "empresas_select_public"
  on public.empresas for select using (true);

-- Só admin cria/edita/deleta
create policy "empresas_insert_admin"
  on public.empresas for insert with check (public.is_admin());

create policy "empresas_update_admin"
  on public.empresas for update using (public.is_admin());

create policy "empresas_delete_admin"
  on public.empresas for delete using (public.is_admin());

-- ────────────────────────────────────────────────────────────
--  USUÁRIOS
-- ────────────────────────────────────────────────────────────
-- Usuário vê apenas o próprio perfil; admin vê tudo
create policy "usuarios_select_own_or_admin"
  on public.usuarios for select
  using (auth.uid() = id or public.is_admin());

-- Não há INSERT/UPDATE pelo cliente. Criação e alteração de roles passam por
-- uma função de servidor usando a service role.

-- ────────────────────────────────────────────────────────────
--  ROCHAS
-- ────────────────────────────────────────────────────────────
-- Leitura pública
create policy "rochas_select_public"
  on public.rochas for select using (true);

-- Admin insere qualquer rocha
create policy "rochas_insert_admin"
  on public.rochas for insert
  with check (public.is_admin());

-- Empresa insere rocha apenas para a própria empresa
create policy "rochas_insert_empresa"
  on public.rochas for insert
  with check (
    exists (
      select 1 from public.usuarios
      where id = auth.uid()
        and role = 'empresa'
        and empresa_id = rochas.empresa_id
    )
  );

-- Admin ou empresa dona pode atualizar
create policy "rochas_update"
  on public.rochas for update
  using (
    public.is_admin() or
    (public.my_empresa_id() = empresa_id)
  );

-- Admin ou empresa dona pode deletar
create policy "rochas_delete"
  on public.rochas for delete
  using (
    public.is_admin() or
    (public.my_empresa_id() = empresa_id)
  );

-- ────────────────────────────────────────────────────────────
--  MOVIMENTAÇÕES
-- ────────────────────────────────────────────────────────────
-- Admin vê tudo; empresa vê só as suas
create policy "mov_select"
  on public.movimentacoes for select
  using (
    public.is_admin() or
    exists (
      select 1 from public.rochas r
      where r.id = movimentacoes.rocha_id
        and r.empresa_id = public.my_empresa_id()
    )
  );

-- Admin ou empresa dona cria movimentação
create policy "mov_insert"
  on public.movimentacoes for insert
  with check (
    public.is_admin() or
    exists (
      select 1 from public.rochas r
      where r.id = rocha_id
        and r.empresa_id = public.my_empresa_id()
    )
  );

-- Ninguém edita ou deleta movimentações (imutável)
create policy "mov_no_update" on public.movimentacoes for update using (false);
create policy "mov_no_delete" on public.movimentacoes for delete using (false);

-- ────────────────────────────────────────────────────────────
--  VAGAS
-- ────────────────────────────────────────────────────────────
-- Vagas ativas são públicas; inativas só aparecem para admin ou para a dona.
create policy "vagas_select_visible"
  on public.vagas for select
  using (
    ativa = true
    or public.is_admin()
    or empresa_id = public.my_empresa_id()
  );

-- Admin insere qualquer vaga
create policy "vagas_insert_admin"
  on public.vagas for insert
  with check (public.is_admin());

-- Empresa insere vaga só para si mesma
create policy "vagas_insert_empresa"
  on public.vagas for insert
  with check (
    exists (
      select 1 from public.usuarios
      where id = auth.uid()
        and role = 'empresa'
        and empresa_id = vagas.empresa_id
    )
  );

-- Admin ou empresa dona pode atualizar/deletar
create policy "vagas_update"
  on public.vagas for update
  using (public.is_admin() or public.my_empresa_id() = empresa_id);

create policy "vagas_delete"
  on public.vagas for delete
  using (public.is_admin() or public.my_empresa_id() = empresa_id);

-- ────────────────────────────────────────────────────────────
--  AVISOS
-- ────────────────────────────────────────────────────────────
create policy "avisos_select_public"
  on public.avisos for select using (true);

create policy "avisos_write_admin"
  on public.avisos for all using (public.is_admin());

-- ============================================================
--  FUNÇÃO: atualizar estoque de forma atômica
--  Evita race condition ao movimentar m²
-- ============================================================
create or replace function public.movimentar_estoque(
  p_rocha_id  uuid,
  p_tipo      text,
  p_m2        numeric,
  p_obs       text default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_novo_estoque numeric;
  v_empresa_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Autenticação obrigatória.' using errcode = '42501';
  end if;

  if p_tipo not in ('entrada', 'saida') then
    raise exception 'Tipo de movimentação inválido.' using errcode = '22023';
  end if;

  if p_m2 is null or p_m2 <= 0 then
    raise exception 'A quantidade deve ser maior que zero.' using errcode = '22023';
  end if;

  -- Bloqueia a linha para update
  select estoque_m2, empresa_id into v_novo_estoque, v_empresa_id
  from public.rochas
  where id = p_rocha_id
  for update;

  if not found then
    raise exception 'Rocha não encontrada.' using errcode = 'P0002';
  end if;

  if not public.is_admin() and v_empresa_id is distinct from public.my_empresa_id() then
    raise exception 'Sem permissão para movimentar esta rocha.' using errcode = '42501';
  end if;

  if p_tipo = 'entrada' then
    v_novo_estoque := v_novo_estoque + p_m2;
  elsif p_tipo = 'saida' then
    v_novo_estoque := v_novo_estoque - p_m2;
    if v_novo_estoque < 0 then
      raise exception 'Saldo insuficiente para saída.';
    end if;
  end if;

  -- Atualiza o estoque
  update public.rochas
  set estoque_m2 = v_novo_estoque
  where id = p_rocha_id;

  -- Registra o movimento
  insert into public.movimentacoes (rocha_id, tipo, m2, obs, user_id)
  values (p_rocha_id, p_tipo, p_m2, p_obs, auth.uid());
end;
$$;

revoke all on function public.movimentar_estoque(uuid, text, numeric, text) from public;
revoke all on function public.movimentar_estoque(uuid, text, numeric, text) from anon;
grant execute on function public.movimentar_estoque(uuid, text, numeric, text) to authenticated;

-- ============================================================
--  STORAGE BUCKET para fotos de rochas
-- ============================================================
insert into storage.buckets (id, name, public)
values ('rochas', 'rochas', true)
on conflict (id) do nothing;

-- Qualquer um pode ver as fotos
create policy "rochas_storage_select"
  on storage.objects for select
  using (bucket_id = 'rochas');

-- Novos arquivos usam o caminho empresa_id/arquivo.ext.
create policy "rochas_storage_insert_owner"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'rochas'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = public.my_empresa_id()::text
    )
  );

create policy "rochas_storage_delete_owner"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'rochas'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = public.my_empresa_id()::text
    )
  );
