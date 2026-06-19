// src/components/ListaRochas.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "./context/AuthContext";
import fundoImage from "../img/fundo.png";

// ── Ícones inline ────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
  </svg>
);
const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);
const IconPin = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);
const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// ── Badge de tipo ────────────────────────────────────────────────────────────
const TipoBadge = ({ tipo }) => {
  const cores = {
    Granito: "bg-amber-900/40 text-amber-300 border-amber-700/40",
    Mármore: "bg-slate-800/60 text-slate-300 border-slate-600/40",
    Quartzito: "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
    Travertino: "bg-orange-900/40 text-orange-300 border-orange-700/40",
    Basalto: "bg-zinc-800/60 text-zinc-300 border-zinc-600/40",
  };
  const cls = cores[tipo] || "bg-white/10 text-white/60 border-white/10";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${cls}`}>
      {tipo || "Rocha"}
    </span>
  );
};

// ── Skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-xl overflow-hidden border border-white/5 animate-pulse" style={{ background: "#111" }}>
    <div className="h-52 bg-white/5" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-white/10 rounded w-2/3" />
      <div className="h-3 bg-white/5 rounded w-1/3" />
    </div>
  </div>
);

// ── Componente principal ─────────────────────────────────────────────────────
export default function ListaRochas() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const isAdmin = profile?.role === "admin";
  const isEmpresa = profile?.role === "empresa";

  // Estado principal
  const [rochas, setRochas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtro, setFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [acabamentoFiltro, setAcabamentoFiltro] = useState("");

  // Detalhe
  const [rochaSelecionada, setRochaSelecionada] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Estoque inline
  const [m2Input, setM2Input] = useState("");
  const [estoqueLoading, setEstoqueLoading] = useState(false);
  const [estoqueMsg, setEstoqueMsg] = useState("");

  // Confirmação de deleção
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Carrega rochas ─────────────────────────────────────────────────────────
  useEffect(() => {
    const buscar = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "rochas"));
        const lista = await Promise.all(
          snap.docs.map(async (d) => {
            const r = { id: d.id, ...d.data() };
            let empresa = null;
            if (r.empresaId) {
              const eSnap = await getDoc(doc(db, "empresas", r.empresaId));
              empresa = eSnap.exists() ? { id: eSnap.id, ...eSnap.data() } : null;
            }
            return { ...r, empresa };
          })
        );
        setRochas(lista);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    buscar();
  }, []);

  // ── Tipos e acabamentos únicos para os filtros ─────────────────────────────
  const tipos = useMemo(() => [...new Set(rochas.map((r) => r.tipo).filter(Boolean))], [rochas]);
  const acabamentos = useMemo(() => [...new Set(rochas.map((r) => r.acabamento).filter(Boolean))], [rochas]);

  // ── Filtro aplicado ────────────────────────────────────────────────────────
  const rochasFiltradas = useMemo(() => {
    const t = filtro.toLowerCase();
    return rochas.filter((r) => {
      const matchTexto =
        !t ||
        r.nome?.toLowerCase().includes(t) ||
        r.tipo?.toLowerCase().includes(t) ||
        r.empresa?.nome?.toLowerCase().includes(t);
      const matchTipo = !tipoFiltro || r.tipo === tipoFiltro;
      const matchAcab = !acabamentoFiltro || r.acabamento === acabamentoFiltro;
      return matchTexto && matchTipo && matchAcab;
    });
  }, [rochas, filtro, tipoFiltro, acabamentoFiltro]);

  // ── Abre o detalhe ─────────────────────────────────────────────────────────
  const abrirDetalhe = (rocha) => {
    setRochaSelecionada(rocha);
    setDrawerOpen(true);
    setM2Input("");
    setEstoqueMsg("");
    setConfirmDelete(false);
  };

  const fecharDetalhe = () => {
    setDrawerOpen(false);
    setTimeout(() => setRochaSelecionada(null), 350);
  };

  // ── Verifica se o usuário pode editar esta rocha ───────────────────────────
  const podeEditar = (rocha) =>
    isAdmin || (isEmpresa && profile?.companyId === rocha?.empresa?.id);

  // ── Adicionar estoque ──────────────────────────────────────────────────────
  const adicionarEstoque = async () => {
    const valor = Number(m2Input);
    if (!valor || valor <= 0) {
      setEstoqueMsg("Informe um valor válido.");
      return;
    }
    setEstoqueLoading(true);
    setEstoqueMsg("");
    try {
      const novoM2 = (rochaSelecionada.m2 || 0) + valor;
      await updateDoc(doc(db, "rochas", rochaSelecionada.id), { m2: novoM2 });
      // Atualiza local sem reload
      const atualizada = { ...rochaSelecionada, m2: novoM2 };
      setRochaSelecionada(atualizada);
      setRochas((prev) => prev.map((r) => (r.id === rochaSelecionada.id ? atualizada : r)));
      setM2Input("");
      setEstoqueMsg("Estoque atualizado!");
      setTimeout(() => setEstoqueMsg(""), 3000);
    } catch {
      setEstoqueMsg("Erro ao atualizar estoque.");
    } finally {
      setEstoqueLoading(false);
    }
  };

  // ── Deletar rocha ──────────────────────────────────────────────────────────
  const deletarRocha = async () => {
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, "rochas", rochaSelecionada.id));
      setRochas((prev) => prev.filter((r) => r.id !== rochaSelecionada.id));
      fecharDetalhe();
    } catch {
      setConfirmDelete(false);
    } finally {
      setDeleteLoading(false);
    }
  };

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
      {/* Overlay escuro */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/70 to-[#0A0A0A]/95 pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20">

        {/* ── Cabeçalho ── */}
        <div className="mb-10">
          <p
            className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase mb-2"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Marketplace
          </p>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1
              className="text-3xl sm:text-4xl font-bold text-white"
              style={{ fontFamily: "Orbitron, sans-serif", letterSpacing: "0.04em" }}
            >
              Rochas Ornamentais
            </h1>
            {(isAdmin || isEmpresa) && (
              <button
                onClick={() => navigate("/cadastro-rocha")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wider transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #C9A96E, #a07840)",
                  color: "#0A0A0A",
                  boxShadow: "0 0 20px rgba(201,169,110,0.25)",
                }}
              >
                <IconPlus /> Cadastrar Rocha
              </button>
            )}
          </div>
        </div>

        {/* ── Filtros ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Busca */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Buscar por nome, tipo ou empresa…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(201,169,110,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          {/* Tipo */}
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="px-4 py-3 rounded-xl text-sm text-white/70 outline-none transition-all duration-200 cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              minWidth: "140px",
            }}
          >
            <option value="">Todos os tipos</option>
            {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Acabamento */}
          <select
            value={acabamentoFiltro}
            onChange={(e) => setAcabamentoFiltro(e.target.value)}
            className="px-4 py-3 rounded-xl text-sm text-white/70 outline-none transition-all duration-200 cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              minWidth: "160px",
            }}
          >
            <option value="">Todos os acabamentos</option>
            {acabamentos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* ── Contagem ── */}
        {!loading && (
          <p className="text-white/30 text-xs mb-6 tracking-wide">
            {rochasFiltradas.length} {rochasFiltradas.length === 1 ? "rocha encontrada" : "rochas encontradas"}
          </p>
        )}

        {/* ── Grid de cards ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : rochasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(201,169,110,0.08)" }}>
              <IconSearch />
            </div>
            <p className="text-white/40 text-sm">Nenhuma rocha encontrada.</p>
            {(filtro || tipoFiltro || acabamentoFiltro) && (
              <button
                onClick={() => { setFiltro(""); setTipoFiltro(""); setAcabamentoFiltro(""); }}
                className="mt-4 text-[#C9A96E] text-xs hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rochasFiltradas.map((rocha) => (
              <RochaCard
                key={rocha.id}
                rocha={rocha}
                onClick={() => abrirDetalhe(rocha)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Drawer de detalhe ── */}
      {/* Backdrop */}
      <div
        onClick={fecharDetalhe}
        className="fixed inset-0 z-40 transition-all duration-350"
        style={{
          background: drawerOpen ? "rgba(0,0,0,0.7)" : "transparent",
          pointerEvents: drawerOpen ? "auto" : "none",
          backdropFilter: drawerOpen ? "blur(4px)" : "none",
        }}
      />

      {/* Painel lateral */}
      <div
        className="fixed top-0 right-0 h-full z-50 overflow-y-auto"
        style={{
          width: "min(520px, 100vw)",
          background: "#0E0E0E",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: drawerOpen ? "-20px 0 60px rgba(0,0,0,0.6)" : "none",
        }}
      >
        {rochaSelecionada && (
          <DetalheRocha
            rocha={rochaSelecionada}
            podeEditar={podeEditar(rochaSelecionada)}
            m2Input={m2Input}
            setM2Input={setM2Input}
            estoqueLoading={estoqueLoading}
            estoqueMsg={estoqueMsg}
            adicionarEstoque={adicionarEstoque}
            confirmDelete={confirmDelete}
            setConfirmDelete={setConfirmDelete}
            deleteLoading={deleteLoading}
            deletarRocha={deletarRocha}
            onClose={fecharDetalhe}
          />
        )}
      </div>
    </div>
  );
}

// ── Card de rocha ────────────────────────────────────────────────────────────
function RochaCard({ rocha, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
      style={{
        background: "#111111",
        border: hover ? "1px solid rgba(201,169,110,0.35)" : "1px solid rgba(255,255,255,0.06)",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hover ? "0 16px 48px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {/* Imagem */}
      <div className="relative h-52 overflow-hidden bg-white/5">
        {rocha.fotoUrl ? (
          <img
            src={rocha.fotoUrl}
            alt={rocha.nome}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transform: hover ? "scale(1.06)" : "scale(1)" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white/10 text-5xl">◈</span>
          </div>
        )}
        {/* Badge tipo sobre a imagem */}
        {rocha.tipo && (
          <div className="absolute top-3 left-3">
            <TipoBadge tipo={rocha.tipo} />
          </div>
        )}
        {/* Estoque badge */}
        {rocha.m2 != null && (
          <div
            className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs text-white/70"
            style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {rocha.m2} m²
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3
          className="text-white font-semibold text-base mb-1 truncate transition-colors duration-300"
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "0.82rem",
            letterSpacing: "0.04em",
            color: hover ? "#C9A96E" : "#fff",
          }}
        >
          {rocha.nome}
        </h3>

        <div className="flex items-center gap-1.5 text-white/40 text-xs truncate">
          <IconPin />
          <span className="truncate">{rocha.empresa?.nome || "Empresa não informada"}</span>
        </div>

        {rocha.acabamento && (
          <p className="text-white/30 text-xs mt-2 truncate">
            Acabamento: {rocha.acabamento}
          </p>
        )}

        <div
          className="mt-4 flex items-center gap-1 text-xs tracking-widest uppercase transition-colors duration-300"
          style={{ color: hover ? "#C9A96E" : "rgba(255,255,255,0.2)" }}
        >
          Ver detalhes
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Drawer de detalhe ────────────────────────────────────────────────────────
function DetalheRocha({
  rocha,
  podeEditar,
  m2Input, setM2Input,
  estoqueLoading, estoqueMsg,
  adicionarEstoque,
  confirmDelete, setConfirmDelete,
  deleteLoading, deletarRocha,
  onClose,
}) {
  return (
    <div className="flex flex-col h-full">

      {/* Header do drawer */}
      <div
        className="flex items-center justify-between px-6 py-5 sticky top-0 z-10"
        style={{ background: "#0E0E0E", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
        >
          <IconBack /> Voltar
        </button>
        <span
          className="text-white/20 text-xs tracking-widest uppercase"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          Detalhe
        </span>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
        >
          <IconClose />
        </button>
      </div>

      {/* Imagem */}
      <div className="relative w-full" style={{ height: "260px", background: "#0A0A0A" }}>
        {rocha.fotoUrl ? (
          <img
            src={rocha.fotoUrl}
            alt={rocha.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white/5 text-8xl">◈</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0E] via-transparent to-transparent" />
      </div>

      {/* Conteúdo */}
      <div className="px-6 pb-10 flex-1">

        {/* Nome + tipo */}
        <div className="mt-4 mb-6">
          <h2
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: "Orbitron, sans-serif", letterSpacing: "0.04em" }}
          >
            {rocha.nome}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {rocha.tipo && <TipoBadge tipo={rocha.tipo} />}
            {rocha.acabamento && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border border-white/10 text-white/40">
                {rocha.acabamento}
              </span>
            )}
          </div>
        </div>

        {/* Linha separadora */}
        <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* Infos em grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <InfoBox label="Empresa" value={rocha.empresa?.nome || "—"} />
          <InfoBox label="Estoque atual" value={`${rocha.m2 ?? 0} m²`} highlight />
          {rocha.tipo && <InfoBox label="Tipo" value={rocha.tipo} />}
          {rocha.acabamento && <InfoBox label="Acabamento" value={rocha.acabamento} />}
        </div>

        {/* Controles de estoque (só para empresa dona ou admin) */}
        {podeEditar && (
          <>
            <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="mb-6">
              <p
                className="text-white/30 text-xs tracking-widest uppercase mb-3"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Gerenciar Estoque
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="m² a adicionar"
                  value={m2Input}
                  onChange={(e) => setM2Input(e.target.value)}
                  min="0"
                  step="0.01"
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm text-white placeholder-white/20 outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(201,169,110,0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <button
                  onClick={adicionarEstoque}
                  disabled={estoqueLoading}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: "rgba(201,169,110,0.15)", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.2)" }}
                >
                  {estoqueLoading ? "…" : <><IconPlus /> Adicionar</>}
                </button>
              </div>
              {estoqueMsg && (
                <p
                  className="text-xs mt-2 transition-all"
                  style={{ color: estoqueMsg.includes("Erro") ? "#f87171" : "#86efac" }}
                >
                  {estoqueMsg}
                </p>
              )}
            </div>

            {/* Deletar */}
            <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.06)" }} />
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 text-red-400/60 hover:text-red-400 text-sm transition-colors"
              >
                <IconTrash /> Excluir esta rocha
              </button>
            ) : (
              <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <p className="text-red-400 text-sm mb-3">Tem certeza? Esta ação não pode ser desfeita.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 rounded-lg text-sm text-white/50 border border-white/10 hover:border-white/20 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={deletarRocha}
                    disabled={deleteLoading}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleteLoading ? "Excluindo…" : "Confirmar exclusão"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Mapa */}
        {rocha.empresa?.endereco && (
          <>
            <div className="h-px my-6" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div>
              <p
                className="text-white/30 text-xs tracking-widest uppercase mb-3 flex items-center gap-2"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                <IconPin /> Localização
              </p>
              <p className="text-white/40 text-xs mb-3">{rocha.empresa.endereco}</p>
              <div className="w-full rounded-xl overflow-hidden" style={{ height: "240px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <iframe
                  title="mapa"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: "grayscale(80%) brightness(0.7)" }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.google.com/maps?q=${encodeURIComponent(rocha.empresa.endereco)}&output=embed`}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Caixa de info ────────────────────────────────────────────────────────────
function InfoBox({ label, value, highlight }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: highlight ? "rgba(201,169,110,0.06)" : "rgba(255,255,255,0.03)",
        border: highlight ? "1px solid rgba(201,169,110,0.15)" : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <p className="text-white/30 text-xs mb-1" style={{ fontFamily: "Orbitron, sans-serif", letterSpacing: "0.1em", fontSize: "0.65rem" }}>
        {label.toUpperCase()}
      </p>
      <p
        className="font-semibold text-sm"
        style={{ color: highlight ? "#C9A96E" : "rgba(255,255,255,0.85)" }}
      >
        {value}
      </p>
    </div>
  );
}
