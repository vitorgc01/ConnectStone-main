// src/components/CadastroEmpresa.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import fundoImage from "../img/fundo.png";

// ── Ícones ───────────────────────────────────────────────────────────────────
const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);
const IconBuilding = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M3 21h18M5 21V7l7-4 7 4v14" />
    <rect x="9" y="13" width="6" height="8" rx="0.5" />
  </svg>
);
const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);
const IconEye = ({ off }) => off ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconWarn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconSpinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);
const IconPin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

// ── Campo de formulário ───────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label
        className="block text-xs tracking-widest uppercase"
        style={{ fontFamily: "Orbitron, sans-serif", color: "rgba(255,255,255,0.3)", fontSize: "0.6rem" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Input com ícone à esquerda ────────────────────────────────────────────────
function IconInput({ icon, rightSlot, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${focused ? "rgba(201,169,110,0.5)" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <span style={{ color: focused ? "#C9A96E" : "rgba(255,255,255,0.2)", flexShrink: 0 }}>
        {icon}
      </span>
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          color: "white",
          width: "100%",
          fontSize: "0.875rem",
        }}
      />
      {rightSlot && <span style={{ flexShrink: 0 }}>{rightSlot}</span>}
    </div>
  );
}

// ── Separador de seção ────────────────────────────────────────────────────────
function SectionDivider({ step, label }) {
  return (
    <div className="flex items-center gap-4 my-2">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background: "rgba(201,169,110,0.15)", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.25)" }}
      >
        {step}
      </div>
      <p
        className="text-xs tracking-widest uppercase flex-1"
        style={{ fontFamily: "Orbitron, sans-serif", color: "rgba(255,255,255,0.25)", fontSize: "0.6rem" }}
      >
        {label}
      </p>
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
    </div>
  );
}

// ── Força de senha ────────────────────────────────────────────────────────────
function PasswordStrength({ senha }) {
  if (!senha) return null;
  const score = [senha.length >= 8, /[A-Z]/.test(senha), /[0-9]/.test(senha), /[^A-Za-z0-9]/.test(senha)].filter(Boolean).length;
  const labels = ["", "Fraca", "Regular", "Boa", "Forte"];
  const colors = ["", "#f87171", "#fb923c", "#facc15", "#4ade80"];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-1 h-0.5 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score] : "rgba(255,255,255,0.08)" }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[score] || "transparent" }}>
        Senha {labels[score]}
      </p>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function CadastroEmpresa() {
  const navigate = useNavigate();

  // Dados da empresa
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cnpj, setCnpj] = useState("");

  // Acesso
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Status
  const [salvando, setSalvando] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [sucesso, setSucesso] = useState(false);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setStatusType("");

    if (senha !== confirmarSenha) {
      setStatus("As senhas não coincidem.");
      setStatusType("error");
      return;
    }
    if (senha.length < 6) {
      setStatus("A senha deve ter pelo menos 6 caracteres.");
      setStatusType("error");
      return;
    }

    setSalvando(true);

    try {
      // 1) Cria a empresa no Firestore
      const empresaRef = await addDoc(collection(db, "empresas"), {
        nome,
        endereco,
        telefone: telefone || null,
        cnpj: cnpj || null,
        criadoEm: new Date(),
      });

      // 2) Cria o usuário Auth
      const cred = await createUserWithEmailAndPassword(auth, email, senha);

      // 3) Cria o perfil do usuário vinculando à empresa
      await setDoc(doc(db, "usuarios", cred.user.uid), {
        role: "empresa",
        companyId: empresaRef.id,
      });

      setSucesso(true);
      setStatus("Empresa e usuário criados com sucesso!");
      setStatusType("success");

      // Reset
      setNome(""); setEndereco(""); setTelefone(""); setCnpj("");
      setEmail(""); setSenha(""); setConfirmarSenha("");
    } catch (err) {
      console.error(err);
      let msg = "Erro ao cadastrar empresa.";
      if (err.code === "auth/email-already-in-use") msg = "Este e-mail já está em uso.";
      else if (err.code === "auth/weak-password") msg = "A senha deve ter pelo menos 6 caracteres.";
      else if (err.code === "auth/invalid-email") msg = "E-mail inválido.";
      setStatus(msg);
      setStatusType("error");
    } finally {
      setSalvando(false);
    }
  };

  // ── Tela de sucesso ───────────────────────────────────────────────────────
  if (sucesso) {
    return (
      <div
        className="min-h-screen relative flex items-center justify-center px-4"
        style={{
          backgroundImage: `url(${fundoImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="fixed inset-0 bg-gradient-to-b from-black/85 via-black/75 to-[#0A0A0A]/95 pointer-events-none" />
        <div
          className="relative z-10 w-full max-w-md rounded-2xl p-10 text-center"
          style={{
            background: "rgba(14,14,14,0.96)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)" }}
          >
            <span className="text-green-400"><IconCheck /></span>
          </div>
          <h2
            className="text-xl font-bold text-white mb-2"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Empresa cadastrada!
          </h2>
          <p className="text-white/40 text-sm mb-8">
            A empresa e o usuário de acesso foram criados com sucesso.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setSucesso(false); setStatus(""); }}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300"
              style={{ background: "linear-gradient(135deg, #C9A96E, #a07840)", color: "#0A0A0A" }}
            >
              Cadastrar outra empresa
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 rounded-xl text-sm text-white/40 hover:text-white/70 border border-white/08 hover:border-white/15 transition-all duration-300"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulário ────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${fundoImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="fixed inset-0 bg-gradient-to-b from-black/85 via-black/75 to-[#0A0A0A]/95 pointer-events-none z-0" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-28">
        <div
          className="w-full max-w-xl rounded-2xl overflow-hidden"
          style={{
            background: "rgba(14,14,14,0.96)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header */}
          <div
            className="px-8 py-6 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div>
              <p
                className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase mb-1"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Admin
              </p>
              <h1
                className="text-white font-bold text-xl"
                style={{ fontFamily: "Orbitron, sans-serif", letterSpacing: "0.04em" }}
              >
                Cadastrar Empresa
              </h1>
            </div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-white/30 hover:text-white/70 text-xs transition-colors"
            >
              <IconBack /> Voltar
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">

            {/* ── Seção 1: Dados da Empresa ── */}
            <SectionDivider step="1" label="Dados da Empresa" />

            <Field label="Nome da empresa">
              <IconInput
                icon={<IconBuilding />}
                type="text"
                placeholder="Ex: Mármores Vitória Ltda"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </Field>

            <Field label="Endereço completo">
              <IconInput
                icon={<IconPin />}
                type="text"
                placeholder="Rua, número, cidade, estado"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Telefone (opcional)">
                <IconInput
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z" />
                    </svg>
                  }
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </Field>

              <Field label="CNPJ (opcional)">
                <IconInput
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  }
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                />
              </Field>
            </div>

            {/* ── Seção 2: Acesso ── */}
            <SectionDivider step="2" label="Credenciais de Acesso" />

            <Field label="E-mail de acesso">
              <IconInput
                icon={<IconMail />}
                type="email"
                placeholder="empresa@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            <Field label="Senha">
              <IconInput
                icon={<IconLock />}
                type={mostrarSenha ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    className="text-white/25 hover:text-white/60 transition-colors"
                  >
                    <IconEye off={mostrarSenha} />
                  </button>
                }
              />
              <PasswordStrength senha={senha} />
            </Field>

            <Field label="Confirmar senha">
              <IconInput
                icon={<IconLock />}
                type={mostrarSenha ? "text" : "password"}
                placeholder="Repita a senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                minLength={6}
                rightSlot={
                  confirmarSenha && (
                    <span style={{ color: confirmarSenha === senha ? "#4ade80" : "#f87171" }}>
                      {confirmarSenha === senha ? <IconCheck /> : <IconWarn />}
                    </span>
                  )
                }
              />
            </Field>

            {/* Erro */}
            {status && statusType === "error" && (
              <div
                className="rounded-xl p-4 flex items-center gap-3 text-sm"
                style={{
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  color: "#f87171",
                }}
              >
                <IconWarn /> {status}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={salvando}
              className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wider uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{
                background: salvando
                  ? "rgba(201,169,110,0.15)"
                  : "linear-gradient(135deg, #C9A96E, #a07840)",
                color: salvando ? "#C9A96E" : "#0A0A0A",
                boxShadow: salvando ? "none" : "0 0 24px rgba(201,169,110,0.2)",
              }}
            >
              {salvando ? (
                <span className="flex items-center justify-center gap-2">
                  <IconSpinner /> Cadastrando...
                </span>
              ) : (
                "Cadastrar Empresa"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
