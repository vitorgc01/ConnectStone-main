import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync(
  new URL("../supabase/migrations/202609260001_security_hardening.sql", import.meta.url),
  "utf8",
);

describe("migração de segurança", () => {
  it("bloqueia execução pública da movimentação de estoque", () => {
    expect(sql).toContain("revoke all on function public.movimentar_estoque");
    expect(sql).toContain("from anon");
    expect(sql).toContain("to authenticated");
  });

  it("valida autenticação e propriedade da rocha", () => {
    expect(sql).toContain("if auth.uid() is null");
    expect(sql).toContain("v_empresa_id is distinct from public.my_empresa_id()");
  });

  it("não recria políticas que permitem alterar o próprio role", () => {
    expect(sql).toContain('drop policy if exists "usuarios_update"');
    expect(sql).not.toContain('create policy "usuarios_update"');
    expect(sql).not.toContain('create policy "usuarios_insert_admin"');
  });
});
