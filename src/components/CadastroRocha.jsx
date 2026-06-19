// src/components/CadastroRocha.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../firebase";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  updateDoc,
  increment,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "./context/AuthContext";
import fundoImage from "../img/fundo.png";

// ── Ícones ───────────────────────────────────────────────────────────────────
const IconUpload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// ── Tipos e acabamentos pré-definidos ────────────────────────────────────────
const TIPOS = ["Granito", "Mármore", "Quartzito", "Travertino", "Basalto", "Ardósia", "Outro"];
const ACABAMENTOS = ["Polido", "Escovado", "Flameado", "Apicoado", "Bruto", "Jateado", "Outro"];

// ── Campo de formulário reutilizável ─────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label
        className="block text-xs tracking-widest uppercase"
        style={{ fontFamily: "Orbitron, sans-serif", color: "rgba(255,255,255,0.35)", fontSize: "0.62rem" }}
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-white/25 text-xs">{hint}</p>}
    </div>
  );
}

// ── Input estilizado ─────────────────────────────────────────────────────────
const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  color: "white",
  width: "100%",
  padding: "12px 16px",
  fontSize: "0.9rem",
  outline: "none",
  transition: "border-color 0.2s",
};

function StyledInput({ onFocus, onBlur, ...props }) {
  return (
    <input
      style={inputStyle}
      onFocus={(e) => { e.target.style.borderColor = "rgba(201,169,110,0.5)"; onFocus?.(e); }}
      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; onBlur?.(e); }}
      {...props}
    />
  );
}

function StyledSelect({ children, ...props }) {
  return (
    <select
      style={{
        ...inputStyle,
        cursor: "pointer",
        backgroundColor: "#111827",
        color: "#ffffff",
      }}
      onFocus={(e) => (e.target.style.borderColor = "rgba(201,169,110,0.5)")}
      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      {...props}
    >
      {children}
    </select>
  );
}
// ── Componente principal ─────────────────────────────────────────────────────
export default function CadastroRocha() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const isAdmin = profile?.role === "admin";
  const isEmpresa = profile?.role === "empresa";

  // Estado
  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaId] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [acabamento, setAcabamento] = useState("");
  const [entradaInicial, setEntradaInicial] = useState("");

  const [imagem, setImagem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100

  const [rochasExistentes, setRochasExistentes] = useState([]);
  const [usarRochaExistente, setUsarRochaExistente] = useState("");
  const [checandoDuplicata, setChecandoDuplicata] = useState(false);
  const [existeDuplicata, setExisteDuplicata] = useState(false);

  const debounceTimer = useRef(null);

  const normalize = (s) => (s || "").trim().toLowerCase();
  const finalEmpresaId = useMemo(
    () => (isEmpresa ? profile?.companyId : empresaId),
    [isEmpresa, profile?.companyId, empresaId]
  );

  // ── Carrega empresas ───────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const loadEmpresas = async () => {
      try {
        if (isAdmin) {
          const snap = await getDocs(collection(db, "empresas"));
          setEmpresas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } else if (isEmpresa && profile?.companyId) {
          const empSnap = await getDoc(doc(db, "empresas", profile.companyId));
          if (empSnap.exists()) {
            setEmpresaId(empSnap.id);
            setEmpresaNome(empSnap.data().nome || "");
          } else {
            setStatus("Empresa vinculada não encontrada.");
            setStatusType("error");
          }
        }
      } catch {
        setStatus("Erro ao carregar empresas.");
        setStatusType("error");
      }
    };
    loadEmpresas();
  }, [loading, isAdmin, isEmpresa, profile]);

  // ── Checagem de duplicata com debounce ─────────────────────────────────────
  useEffect(() => {
    setRochasExistentes([]);
    setUsarRochaExistente("");
    setExisteDuplicata(false);

    if (!finalEmpresaId) return;
    const nomeNorm = nome.trim();
    if (nomeNorm.length < 2) {
      clearTimeout(debounceTimer.current);
      return;
    }

    setChecandoDuplicata(true);
    clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const qDup = query(
          collection(db, "rochas"),
          where("empresaId", "==", finalEmpresaId),
          where("nome", "==", nomeNorm)
        );
        const snap = await getDocs(qDup);
        if (!snap.empty) {
          setRochasExistentes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setExisteDuplicata(true);
        }
      } catch (err) {
        console.error("Erro ao verificar duplicata:", err);
      } finally {
        setChecandoDuplicata(false);
      }
    }, 350);

    return () => clearTimeout(debounceTimer.current);
  }, [nome, finalEmpresaId]);

  // ── Preview de imagem ──────────────────────────────────────────────────────
  const handleImagemChange = (e) => {
    const file = e.target.files[0];
    setImagem(file || null);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const removerImagem = () => {
    setImagem(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setStatusType("");
    setSalvando(true);
    setUploadProgress(0);

    try {
      if (!finalEmpresaId) {
        setStatus("Selecione a empresa (ou verifique seu vínculo).");
        setStatusType("error");
        setSalvando(false);
        return;
      }

      const nomeNorm = nome.trim();
      const m2 = Number(entradaInicial || 0);

      // Checagem final de duplicata no servidor
      const qDup = query(
        collection(db, "rochas"),
        where("empresaId", "==", finalEmpresaId),
        where("nome", "==", nomeNorm)
      );
      const dupSnap = await getDocs(qDup);

      if (!dupSnap.empty && !usarRochaExistente) {
        setStatus("Já existe uma rocha com esse nome nessa empresa.");
        setStatusType("error");
        setSalvando(false);
        return;
      }

      // ── FLUXO: usar rocha existente ──
      if (usarRochaExistente) {
        setUploadProgress(50);
        if (m2 > 0) {
          await updateDoc(doc(db, "rochas", usarRochaExistente), {
            estoqueM2: increment(m2),
          });
          if (user?.uid) {
            await addDoc(collection(db, "rochas", usarRochaExistente, "estoque"), {
              tipo: "entrada",
              m2,
              obs: "Entrada adicional pelo cadastro",
              userId: user.uid,
              criadoEm: new Date(),
            });
          }
        }
        setUploadProgress(100);
        setStatus("Estoque atualizado na rocha existente!");
        setStatusType("success");
        resetForm();
        setSalvando(false);
        return;
      }

      // ── FLUXO: nova rocha ──

      // Upload de imagem
      let fotoUrl = "";
      if (imagem) {
        setUploadProgress(20);
        const safeName = imagem.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "_");
        const imageRef = ref(storage, `rochas/${Date.now()}_${safeName}`);
        const snapImg = await uploadBytes(imageRef, imagem);
        fotoUrl = await getDownloadURL(snapImg.ref);
        setUploadProgress(60);
      }

      // Salva no Firestore
      const novaRochaRef = await addDoc(collection(db, "rochas"), {
        nome: nomeNorm,
        tipo: tipo.trim(),
        acabamento: acabamento.trim(),
        empresaId: finalEmpresaId,
        estoqueM2: m2,
        fotoUrl,
        criadoEm: new Date(),
        criadoPor: user?.uid || null,
      });

      setUploadProgress(80);

      // Movimentação inicial
      if (m2 > 0 && user?.uid) {
        await addDoc(collection(db, "rochas", novaRochaRef.id, "estoque"), {
          tipo: "entrada",
          estoqueM2: m2,
          obs: "Entrada inicial",
          userId: user.uid,
          criadoEm: new Date(),
        });
      }

      setUploadProgress(100);
      setStatus("Rocha cadastrada com sucesso!");
      setStatusType("success");
      resetForm();
    } catch (err) {
      console.error("Erro inesperado:", err);
      setStatus("Erro inesperado ao salvar rocha.");
      setStatusType("error");
    } finally {
      setSalvando(false);
    }
  };

  const resetForm = () => {
    if (isAdmin) setEmpresaId("");
    setNome("");
    setTipo("");
    setAcabamento("");
    setEntradaInicial("");
    setImagem(null);
    setPreviewUrl(null);
    setRochasExistentes([]);
    setExisteDuplicata(false);
    setUsarRochaExistente("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Estados de carregamento / erro de acesso ───────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <div className="flex items-center gap-3 text-white/40">
          <IconSpinner />
          <span className="text-sm">Carregando...</span>
        </div>
      </div>
    );
  }

  if (isEmpresa && !profile?.companyId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <div className="text-center">
          <p className="text-red-400 text-sm">Seu usuário não está vinculado a uma empresa.</p>
          <button onClick={() => navigate("/")} className="mt-4 text-[#C9A96E] text-xs hover:underline">
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
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
      {/* Overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/85 via-black/75 to-[#0A0A0A]/95 pointer-events-none z-0" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-28">
        <div
          className="w-full max-w-xl rounded-2xl overflow-hidden"
          style={{
            background: "rgba(14,14,14,0.95)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header do card */}
          <div
            className="px-8 py-6 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div>
              <p
                className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase mb-1"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Marketplace
              </p>
              <h1
                className="text-white font-bold text-xl"
                style={{ fontFamily: "Orbitron, sans-serif", letterSpacing: "0.04em" }}
              >
                {usarRochaExistente ? "Adicionar Estoque" : "Cadastrar Rocha"}
              </h1>
            </div>
            <button
              onClick={() => navigate("/lista")}
              className="flex items-center gap-2 text-white/30 hover:text-white/70 text-xs transition-colors"
            >
              <IconBack /> Voltar
            </button>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">

            {/* Empresa */}
            <Field label="Empresa">
              {isAdmin ? (
                <StyledSelect
                  value={empresaId}
                  onChange={(e) => setEmpresaId(e.target.value)}
                  required
                >
                  <option value="">Selecione a empresa</option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.nome}</option>
                  ))}
                </StyledSelect>
              ) : (
                <div
                  className="px-4 py-3 rounded-xl text-white/40 text-sm"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {empresaNome || "Carregando empresa..."}
                </div>
              )}
            </Field>

            {/* Nome */}
            <Field label="Nome da Rocha">
              <div className="relative">
                <StyledInput
                  type="text"
                  placeholder="Ex: Granito Verde Ubatuba"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
                {/* Indicador de duplicata */}
                {nome.length >= 2 && finalEmpresaId && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checandoDuplicata ? (
                      <span className="text-white/30"><IconSpinner /></span>
                    ) : existeDuplicata ? (
                      <span className="text-amber-400"><IconWarn /></span>
                    ) : (
                      <span className="text-emerald-400"><IconCheck /></span>
                    )}
                  </div>
                )}
              </div>

              {/* Alerta de duplicata */}
              {existeDuplicata && !checandoDuplicata && (
                <div
                  className="mt-2 rounded-xl p-4"
                  style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)" }}
                >
                  <p className="text-amber-400 text-xs mb-3 flex items-center gap-1.5">
                    <IconWarn /> Já existe uma rocha com esse nome nesta empresa.
                  </p>
                  <p className="text-white/40 text-xs mb-3">
                    Selecione a rocha existente para adicionar estoque, ou escolha outro nome:
                  </p>
                  <StyledSelect
                    value={usarRochaExistente}
                    onChange={(e) => setUsarRochaExistente(e.target.value)}
                  >
                    <option value="">— Criar nova (bloqueado) —</option>
                    {rochasExistentes.map((r) => (
                      <option key={r.id} value={r.id}>
                        Usar existente: {r.nome} · estoque: {typeof r.estoqueM2 === "number" ? r.estoqueM2 : 0} m²
                      </option>
                    ))}
                  </StyledSelect>
                </div>
              )}
            </Field>

            {/* Tipo e Acabamento — só na criação de nova rocha */}
            {!usarRochaExistente && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo">
                  <StyledSelect
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    required
                  >
                    <option value="">Selecionar</option>
                    {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </StyledSelect>
                </Field>
                <Field label="Acabamento">
                  <StyledSelect
                    value={acabamento}
                    onChange={(e) => setAcabamento(e.target.value)}
                    required
                  >
                    <option value="">Selecionar</option>
                    {ACABAMENTOS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </StyledSelect>
                </Field>
              </div>
            )}

            {/* Entrada inicial de m² */}
            <Field label={usarRochaExistente ? "m² a adicionar" : "Entrada inicial (m²)"}>
              <StyledInput
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={entradaInicial}
                onChange={(e) => setEntradaInicial(e.target.value)}
                required
              />
            </Field>

            {/* Upload de imagem — só na criação de nova rocha */}
            {!usarRochaExistente && (
              <Field label="Foto da Rocha" hint="Opcional · JPG, PNG, WEBP">
                {!previewUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative rounded-xl flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-all duration-200 group"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1.5px dashed rgba(255,255,255,0.1)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(201,169,110,0.4)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                  >
                    <span className="text-white/20 group-hover:text-[#C9A96E]/60 transition-colors">
                      <IconUpload />
                    </span>
                    <p className="text-white/30 text-xs group-hover:text-white/50 transition-colors">
                      Clique para selecionar uma imagem
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImagemChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(201,169,110,0.2)" }}>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removerImagem}
                      className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}
                    >
                      <span className="text-white/70 hover:text-white"><IconClose /></span>
                    </button>
                    <div
                      className="absolute bottom-0 left-0 right-0 px-4 py-2 text-xs text-white/50 truncate"
                      style={{ background: "rgba(0,0,0,0.6)" }}
                    >
                      {imagem?.name}
                    </div>
                  </div>
                )}
              </Field>
            )}

            {/* Barra de progresso (durante o upload) */}
            {salvando && uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <div className="flex justify-between text-xs text-white/30 mb-1">
                  <span>Enviando...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%`, background: "linear-gradient(90deg, #C9A96E, #a07840)" }}
                  />
                </div>
              </div>
            )}

            {/* Botão submit */}
            <button
              type="submit"
              disabled={
                salvando ||
                checandoDuplicata ||
                (existeDuplicata && !usarRochaExistente)
              }
              className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wider uppercase transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: salvando || (existeDuplicata && !usarRochaExistente)
                  ? "rgba(201,169,110,0.15)"
                  : "linear-gradient(135deg, #C9A96E, #a07840)",
                color: salvando || (existeDuplicata && !usarRochaExistente) ? "#C9A96E" : "#0A0A0A",
                boxShadow: salvando ? "none" : "0 0 24px rgba(201,169,110,0.2)",
              }}
            >
              {salvando ? (
                <span className="flex items-center justify-center gap-2">
                  <IconSpinner />
                  {usarRochaExistente ? "Atualizando estoque..." : "Cadastrando rocha..."}
                </span>
              ) : existeDuplicata && !usarRochaExistente ? (
                "Selecione a rocha existente para continuar"
              ) : usarRochaExistente ? (
                "Adicionar ao estoque"
              ) : (
                "Cadastrar Rocha"
              )}
            </button>

            {/* Mensagem de status */}
            {status && (
              <div
                className="rounded-xl p-4 text-sm text-center transition-all"
                style={{
                  background: statusType === "success"
                    ? "rgba(134,239,172,0.08)"
                    : "rgba(248,113,113,0.08)",
                  border: `1px solid ${statusType === "success" ? "rgba(134,239,172,0.2)" : "rgba(248,113,113,0.2)"}`,
                  color: statusType === "success" ? "#86efac" : "#f87171",
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  {statusType === "success" ? <IconCheck /> : <IconWarn />}
                  {status}
                </div>
                {statusType === "success" && (
                  <button
                    type="button"
                    onClick={() => navigate("/lista")}
                    className="mt-2 text-xs underline opacity-60 hover:opacity-100 transition-opacity"
                  >
                    Ver lista de rochas →
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
