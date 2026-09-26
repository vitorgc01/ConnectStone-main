import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CompanyInput = {
  nome: string;
  endereco?: string;
  telefone?: string;
  cnpj?: string;
};

type RequestBody = {
  email: string;
  password: string;
  role: "admin" | "empresa";
  empresaId?: string;
  empresa?: CompanyInput;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");

  if (!supabaseUrl || !serviceRoleKey || !authorization?.startsWith("Bearer ")) {
    return json({ error: "Configuração ou autenticação ausente." }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const token = authorization.slice("Bearer ".length);
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Sessão inválida." }, 401);

  const { data: callerProfile } = await admin
    .from("usuarios")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (callerProfile?.role !== "admin") return json({ error: "Acesso restrito a administradores." }, 403);

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Dados inválidos." }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) return json({ error: "E-mail inválido." }, 400);
  if (!body.password || body.password.length < 8) return json({ error: "A senha deve ter ao menos 8 caracteres." }, 400);
  if (!['admin', 'empresa'].includes(body.role)) return json({ error: "Perfil inválido." }, 400);

  let empresaId = body.empresaId || null;
  let createdCompanyId: string | null = null;
  let createdUserId: string | null = null;

  try {
    if (body.empresa) {
      if (!body.empresa.nome?.trim()) return json({ error: "Nome da empresa obrigatório." }, 400);
      const { data: company, error: companyError } = await admin
        .from("empresas")
        .insert({
          nome: body.empresa.nome.trim(),
          endereco: body.empresa.endereco?.trim() || null,
          telefone: body.empresa.telefone?.trim() || null,
          cnpj: body.empresa.cnpj?.trim() || null,
        })
        .select("id")
        .single();
      if (companyError) throw companyError;
      empresaId = company.id;
      createdCompanyId = company.id;
    }

    if (body.role === "empresa" && !empresaId) {
      throw new Error("Selecione ou crie uma empresa para este usuário.");
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
    });
    if (createError) throw createError;
    createdUserId = created.user.id;

    const { error: profileError } = await admin.from("usuarios").insert({
      id: createdUserId,
      role: body.role,
      empresa_id: body.role === "empresa" ? empresaId : null,
    });
    if (profileError) throw profileError;

    return json({ userId: createdUserId, empresaId });
  } catch (error) {
    if (createdUserId) await admin.auth.admin.deleteUser(createdUserId);
    if (createdCompanyId) await admin.from("empresas").delete().eq("id", createdCompanyId);
    const message = error instanceof Error ? error.message : "Erro ao criar usuário.";
    return json({ error: message }, 400);
  }
});
