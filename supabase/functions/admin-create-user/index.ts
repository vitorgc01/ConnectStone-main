// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

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

const errorResponse = (message: string, status = 400) =>
  Response.json({ error: message }, { status });

export default {
  fetch: withSupabase({ auth: "user" }, async (request, ctx) => {
    const callerId = ctx.userClaims?.id;
    if (!callerId) return errorResponse("Sessão inválida.", 401);

    // O cliente com RLS confirma que o chamador é realmente um admin cadastrado.
    const { data: callerProfile, error: callerError } = await ctx.supabase
      .from("usuarios")
      .select("role")
      .eq("id", callerId)
      .single();

    if (callerError || callerProfile?.role !== "admin") {
      return errorResponse("Acesso restrito a administradores.", 403);
    }

    let body: RequestBody;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Dados inválidos.");
    }

    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) return errorResponse("E-mail inválido.");
    if (!body.password || body.password.length < 8) {
      return errorResponse("A senha deve ter ao menos 8 caracteres.");
    }
    if (!["admin", "empresa"].includes(body.role)) {
      return errorResponse("Perfil inválido.");
    }

    const admin = ctx.supabaseAdmin;
    let empresaId = body.empresaId || null;
    let createdCompanyId: string | null = null;
    let createdUserId: string | null = null;

    try {
      if (body.empresa) {
        if (!body.empresa.nome?.trim()) return errorResponse("Nome da empresa obrigatório.");

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

      return Response.json({ userId: createdUserId, empresaId });
    } catch (error) {
      // Compensação para não deixar empresa ou conta órfã quando uma etapa falha.
      if (createdUserId) await admin.auth.admin.deleteUser(createdUserId);
      if (createdCompanyId) await admin.from("empresas").delete().eq("id", createdCompanyId);

      const message = error instanceof Error ? error.message : "Erro ao criar usuário.";
      return errorResponse(message);
    }
  }),
};
