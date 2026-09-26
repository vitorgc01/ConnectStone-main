begin;

-- Helpers executados com privilégios elevados devem usar nomes totalmente
-- qualificados e um search_path vazio.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.usuarios
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.my_empresa_id()
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select empresa_id from public.usuarios where id = auth.uid();
$$;

create or replace function public.get_my_profile()
returns public.usuarios
language sql
security definer
stable
set search_path = ''
as $$
  select * from public.usuarios where id = auth.uid();
$$;

-- O navegador nunca pode atribuir ou alterar roles. Essas operações passam
-- pela Edge Function admin-create-user, que usa a service role no servidor.
drop policy if exists "usuarios_select" on public.usuarios;
drop policy if exists "usuarios_update" on public.usuarios;
drop policy if exists "usuarios_insert_admin" on public.usuarios;

create policy "usuarios_select_own_or_admin"
  on public.usuarios for select
  using (id = auth.uid() or public.is_admin());

-- Vagas inativas são privadas para admin e para a empresa proprietária.
drop policy if exists "vagas_select_public" on public.vagas;
create policy "vagas_select_visible"
  on public.vagas for select
  using (
    ativa = true
    or public.is_admin()
    or empresa_id = public.my_empresa_id()
  );

-- Movimentação atômica, autenticada e limitada à empresa proprietária.
create or replace function public.movimentar_estoque(
  p_rocha_id uuid,
  p_tipo text,
  p_m2 numeric,
  p_obs text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estoque numeric;
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

  select estoque_m2, empresa_id
    into v_estoque, v_empresa_id
  from public.rochas
  where id = p_rocha_id
  for update;

  if not found then
    raise exception 'Rocha não encontrada.' using errcode = 'P0002';
  end if;

  if not public.is_admin() and v_empresa_id is distinct from public.my_empresa_id() then
    raise exception 'Sem permissão para movimentar esta rocha.' using errcode = '42501';
  end if;

  if p_tipo = 'saida' and v_estoque < p_m2 then
    raise exception 'Saldo insuficiente para saída.' using errcode = '22003';
  end if;

  update public.rochas
  set estoque_m2 = case
    when p_tipo = 'entrada' then v_estoque + p_m2
    else v_estoque - p_m2
  end
  where id = p_rocha_id;

  insert into public.movimentacoes (rocha_id, tipo, m2, obs, user_id)
  values (p_rocha_id, p_tipo, p_m2, nullif(trim(p_obs), ''), auth.uid());
end;
$$;

revoke all on function public.movimentar_estoque(uuid, text, numeric, text) from public;
revoke all on function public.movimentar_estoque(uuid, text, numeric, text) from anon;
grant execute on function public.movimentar_estoque(uuid, text, numeric, text) to authenticated;

-- Cada arquivo novo fica dentro da pasta da empresa: empresa_id/arquivo.ext.
drop policy if exists "rochas_storage_insert" on storage.objects;
drop policy if exists "rochas_storage_delete" on storage.objects;

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

commit;
