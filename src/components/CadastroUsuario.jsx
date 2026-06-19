// src/components/CadastroUsuario.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import fundoImage from "../img/fundo.png";

// ── Ícones ────────────────────────────────────────────────────────────────────
const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);
const IconEye = ({ off }) => off ? (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M3 21h18M5 21V7l7-4 7 4v14" />
    <rect x="9" y="13" width="6" height="8" rx="0.5" />
  </svg>
);
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconWarn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconSpinner = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ── Campo label ───────────────────────────────────────────────────────────────
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

// ── Input com ícone ───────────────────────────────────────────────────────────
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

// ── Select com ícone ──────────────────────────────────────────────────────────
function IconSelect({ icon, children, ...props }) {
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
      <select
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          color: props.value ? "white" : "rgba(255,255,255,0.3)",
          width: "100%",
          fontSize: "0.875rem",
          cursor: "pointer",
          appearance: "none",
        }}
      >
        {children}
      </select>
      <span style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0, pointerEvents: "none" }}>
        <IconChevron />
      </span>
    </div>
  );
}

// ── Indicador de força de senha ───────────────────────────────────────────────
function PasswordStrength({ senha }) {
  if (!senha) return null;
  const score = [
    senha.length >= 8,
    /[A-Z]/.test(senha),
    /[0-9]/.test(senha),
    /[^A-Za-z0-9]/.test(senha),
  ].filter(Boolean).length;
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

// ── Card de role ──────────────────────────────────────────────────────────────
function RoleCard({ value, selected, onSelect, icon, title, desc }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className="flex-1 text-left rounded-xl p-4 transition-all duration-200"
      style={{
        background: selected ? "rgba(201,169,110,0.08)" : "rgba(255,255,255,0.02)",
        border: selected ? "1px solid rgba(201,169,110,0.4)" : "1px solid rgba(255,255,255,0.06)",
        boxShadow: selected ? "0 0 20px rgba(201,169,110,0.08)" : "none",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: selected ? "rgba(201,169,110,0.15)" : "rgba(255,255,255,0.05)",
            color: selected ? "#C9A96E" : "rgba(255,255,255,0.3)",
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold mb-0.5 transition-colors"
            style={{ color: selected ? "#C9A96E" : "rgba(255,255,255,0.7)" }}
          >
            {title}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
            {desc}
          </p>
        </div>
        {/* Indicador selecionado */}
        <div
          className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
          style={{
            background: selected ? "#C9A96E" : "transparent",
            border: selected ? "none" : "1.5px solid rgba(255,255,255,0.15)",
          }}
        >
          {selected && (
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="3.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function CadastroUsuario() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [role, setRole] = useState("empresa");
  const [empresas, setEmpresas] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);

  const [salvando, setSalvando] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [nomeUsuarioCriado, setNomeUsuarioCriado] = useState("");

  // ── Carrega empresas ──────────────────────────────────────────────────────
  useEffect(() => {
    const carregar = async () => {
      try {
        const snap = await getDocs(collection(db, "empresas"));
        setEmpresas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        setEmpresas([]);
      } finally {
        setLoadingEmpresas(false);
      }
    };
    carregar();
  }, []);

  // ── Reset ao mudar role ───────────────────────────────────────────────────
  const handleRoleChange = (novoRole) => {
    setRole(novoRole);
    setCompanyId("");
    setStatus("");
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setStatusType("");

    // Validações front-end antes de criar qualquer coisa
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
    if (role === "empresa" && !companyId) {
      setStatus("Selecione uma empresa para este usuário.");
      setStatusType("error");
      return;
    }

    setSalvando(true);

    try {
      // 1) Cria o usuário no Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = cred.user.uid;

      // 2) Salva perfil no Firestore
      const payload = role === "empresa" ? { role, companyId } : { role };
      await setDoc(doc(db, "usuarios", uid), payload);

      // Encontra nome da empresa para exibir no sucesso
      if (role === "empresa") {
        const emp = empresas.find((e) => e.id === companyId);
        setNomeUsuarioCriado(emp?.nome || "");
      } else {
        setNomeUsuarioCriado("Administrador");
      }

      setSucesso(true);
      setStatus("Usuário criado com sucesso!");
      setStatusType("success");

      // Reset
      setEmail(""); setSenha(""); setConfirmarSenha("");
      setRole("empresa"); setCompanyId("");
    } catch (err) {
      let msg = "Erro ao criar usuário.";
      if (err.code === "auth/email-already-in-use") msg = "Este e-mail já está em uso.";
      else if (err.code === "auth/invalid-email") msg = "E-mail inválido.";
      else if (err.code === "auth/weak-password") msg = "Senha muito fraca (mín. 6 caracteres).";
      setStatus(msg);
      setStatusType("error");
    } finally {
      setSalvando(false);
    }
  };

  // ── Empresa selecionada (para exibir no card de sucesso) ──────────────────
  const empresaSelecionada = empresas.find((e) => e.id === companyId);

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
          {/* Ícone de sucesso */}
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
            Usuário criado!
          </h2>

          {/* Resumo do usuário criado */}
          <div
            className="rounded-xl p-4 my-6 text-left space-y-2"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-white/30 text-xs">E-mail</span>
              <span className="text-white/70 text-xs font-medium">{email || "—"}</span>
            </div>
            <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="flex items-center justify-between">
              <span className="text-white/30 text-xs">Perfil</span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: role === "admin" ? "rgba(201,169,110,0.15)" : "rgba(148,163,184,0.1)",
                  color: role === "admin" ? "#C9A96E" : "rgba(255,255,255,0.6)",
                  border: role === "admin" ? "1px solid rgba(201,169,110,0.25)" : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {role === "admin" ? "Admin" : "Empresa"}
              </span>
            </div>
            {role === "empresa" && nomeUsuarioCriado && (
              <>
                <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                <div className="flex items-center justify-between">
                  <span className="text-white/30 text-xs">Empresa</span>
                  <span className="text-white/70 text-xs font-medium">{nomeUsuarioCriado}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setSucesso(false); setStatus(""); setNomeUsuarioCriado(""); }}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300"
              style={{ background: "linear-gradient(135deg, #C9A96E, #a07840)", color: "#0A0A0A" }}
            >
              Criar outro usuário
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 rounded-xl text-sm transition-all duration-300"
              style={{ color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}
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
          {/* ── Header ── */}
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
                Criar Usuário
              </h1>
            </div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-white/30 hover:text-white/70 text-xs transition-colors"
            >
              <IconBack /> Voltar
            </button>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">

            {/* ── Seção 1: Tipo de perfil ── */}
            <div>
              <p
                className="text-xs tracking-widest uppercase mb-3"
                style={{ fontFamily: "Orbitron, sans-serif", color: "rgba(255,255,255,0.25)", fontSize: "0.6rem" }}
              >
                1 — Tipo de perfil
              </p>
              <div className="flex gap-3">
                <RoleCard
                  value="empresa"
                  selected={role === "empresa"}
                  onSelect={handleRoleChange}
                  icon={<IconBuilding />}
                  title="Empresa"
                  desc="Acesso ao catálogo e gestão de estoque da empresa vinculada."
                />
                <RoleCard
                  value="admin"
                  selected={role === "admin"}
                  onSelect={handleRoleChange}
                  icon={<IconShield />}
                  title="Admin"
                  desc="Acesso total ao sistema, empresas, usuários e configurações."
                />
              </div>
            </div>

            {/* ── Empresa vinculada (só role empresa) ── */}
            {role === "empresa" && (
              <div>
                <p
                  className="text-xs tracking-widest uppercase mb-3"
                  style={{ fontFamily: "Orbitron, sans-serif", color: "rgba(255,255,255,0.25)", fontSize: "0.6rem" }}
                >
                  2 — Empresa vinculada
                </p>
                {loadingEmpresas ? (
                  <div className="flex items-center gap-2 text-white/25 text-sm px-4 py-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <IconSpinner /> Carregando empresas...
                  </div>
                ) : empresas.length === 0 ? (
                  <div className="px-4 py-3 rounded-xl text-sm"
                    style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}>
                    <div className="flex items-center gap-2">
                      <IconWarn /> Nenhuma empresa cadastrada.
                    </div>
                  </div>
                ) : (
                  <Field label="">
                    <IconSelect
                      icon={<IconBuilding />}
                      value={companyId}
                      onChange={(e) => setCompanyId(e.target.value)}
                      required
                    >
                      <option value="">Selecione a empresa</option>
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.nome}</option>
                      ))}
                    </IconSelect>
                  </Field>
                )}

                {/* Preview da empresa selecionada */}
                {empresaSelecionada && (
                  <div
                    className="mt-3 px-4 py-3 rounded-xl flex items-center gap-3"
                    style={{ background: "rgba(201,169,110,0.05)", border: "1px solid rgba(201,169,110,0.15)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(201,169,110,0.12)", color: "#C9A96E" }}
                    >
                      <IconBuilding />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm font-medium">{empresaSelecionada.nome}</p>
                      {empresaSelecionada.endereco && (
                        <p className="text-white/30 text-xs">{empresaSelecionada.endereco}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Seção: Credenciais ── */}
            <div>
              <p
                className="text-xs tracking-widest uppercase mb-3"
                style={{ fontFamily: "Orbitron, sans-serif", color: "rgba(255,255,255,0.25)", fontSize: "0.6rem" }}
              >
                {role === "empresa" ? "3" : "2"} — Credenciais de acesso
              </p>

              <div className="space-y-4">
                <Field label="E-mail">
                  <IconInput
                    icon={<IconMail />}
                    type="email"
                    placeholder="usuario@email.com"
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
                          {confirmarSenha === senha ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <IconWarn />
                          )}
                        </span>
                      )
                    }
                  />
                </Field>
              </div>
            </div>

            {/* ── Erro ── */}
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

            {/* ── Botão ── */}
            <button
              type="submit"
              disabled={salvando || (role === "empresa" && !companyId)}
              className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wider uppercase transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
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
                  <IconSpinner /> Criando usuário...
                </span>
              ) : (
                "Criar Usuário"
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
