// src/components/Pages/Estoque.jsx
import { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import {
  collection, getDocs, doc, getDoc,
  addDoc, runTransaction, query, where, orderBy, limit,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import fundoImage from "../../img/fundo.png";

// ── Ícones ───────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
  </svg>
);
const IconArrowUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);
const IconArrowDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </svg>
);
const IconHistory = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
  </svg>
);
const IconChevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconSpinner = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);
const IconWarn = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtM2 = (v) => Number(v ?? 0).toFixed(2);
const fmtData = (ts) => {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

// ── Badge de tipo ─────────────────────────────────────────────────────────────
const TipoBadge = ({ tipo }) => {
  const cores = {
    granito: "bg-amber-900/30 text-amber-300/80 border-amber-700/30",
    mármore: "bg-slate-800/50 text-slate-300/80 border-slate-600/30",
    quartzito: "bg-emerald-900/30 text-emerald-300/80 border-emerald-700/30",
    travertino: "bg-orange-900/30 text-orange-300/80 border-orange-700/30",
    basalto: "bg-zinc-800/50 text-zinc-300/80 border-zinc-600/30",
  };
  const key = (tipo || "").toLowerCase();
  const cls = cores[key] || "bg-white/5 text-white/40 border-white/10";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border capitalize ${cls}`}>
      {tipo || "—"}
    </span>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl border border-white/5 overflow-hidden animate-pulse" style={{ background: "#111" }}>
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-white/8 rounded w-1/2" />
          <div className="h-3 bg-white/5 rounded w-1/3" />
        </div>
        <div className="h-10 w-20 bg-white/5 rounded-xl" />
      </div>
      <div className="h-px bg-white/5" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-white/5 rounded-xl" />
        <div className="h-20 bg-white/5 rounded-xl" />
      </div>
    </div>
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────
export default function Estoque() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const isEmpresa = profile?.role === "empresa";
  const companyId = profile?.companyId || null;

  const [rochas, setRochas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresaFiltro, setEmpresaFiltro] = useState("");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  // ── Carrega empresas (admin) ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    getDocs(collection(db, "empresas")).then((snap) =>
      setEmpresas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [isAdmin]);

  // ── Carrega rochas ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let snap;
        if (isAdmin && empresaFiltro) {
          snap = await getDocs(query(collection(db, "rochas"), where("empresaId", "==", empresaFiltro)));
        } else if (isAdmin) {
          snap = await getDocs(collection(db, "rochas"));
        } else if (isEmpresa && companyId) {
          snap = await getDocs(query(collection(db, "rochas"), where("empresaId", "==", companyId)));
        } else {
          setRochas([]);
          setLoading(false);
          return;
        }

        const lista = await Promise.all(
          snap.docs.map(async (r) => {
            const data = { id: r.id, ...r.data() };
            const eSnap = await getDoc(doc(db, "empresas", data.empresaId));
            const empresa = eSnap.exists() ? { id: eSnap.id, ...eSnap.data() } : null;
            const sSnap = await getDoc(doc(db, "rochas", r.id, "resumo", "saldo"));
            const saldo = sSnap.exists() ? (sSnap.data().m2 || 0) : (data.m2 || 0);
            return { ...data, empresa, saldo };
          })
        );
        setRochas(lista);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin, isEmpresa, companyId, empresaFiltro]);

  // ── Filtro de busca ─────────────────────────────────────────────────────────
  const rochasFiltradas = useMemo(() => {
    const t = busca.toLowerCase();
    if (!t) return rochas;
    return rochas.filter(
      (r) =>
        r.nome?.toLowerCase().includes(t) ||
        r.tipo?.toLowerCase().includes(t) ||
        r.empresa?.nome?.toLowerCase().includes(t)
    );
  }, [rochas, busca]);

  // ── Estatísticas (admin) ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalM2 = rochas.reduce((acc, r) => acc + (r.saldo || 0), 0);
    const semEstoque = rochas.filter((r) => (r.saldo || 0) === 0).length;
    return { totalM2, semEstoque, totalRochas: rochas.length };
  }, [rochas]);

  // ── Movimentar ──────────────────────────────────────────────────────────────
  const movimentar = async (rochaId, tipo, m2, obs = "") => {
    const valor = Number(m2);
    if (!valor || valor <= 0 || !user?.uid) return;

    const saldoRef = doc(db, "rochas", rochaId, "resumo", "saldo");
    const movCol = collection(db, "rochas", rochaId, "estoque");

    await runTransaction(db, async (tx) => {
      const sSnap = await tx.get(saldoRef);
      const atual = sSnap.exists() ? (sSnap.data().m2 || 0) : 0;
      const novo = tipo === "entrada" ? atual + valor : atual - valor;
      if (novo < 0) throw new Error("Saldo insuficiente para saída.");
      tx.set(saldoRef, { m2: novo }, { merge: true });
    });

    await addDoc(movCol, {
      tipo, m2: valor, obs,
      userId: user.uid,
      criadoEm: new Date(),
    });

    setRochas((prev) =>
      prev.map((r) =>
        r.id === rochaId
          ? { ...r, saldo: tipo === "entrada" ? r.saldo + valor : r.saldo - valor }
          : r
      )
    );
  };

  const podeMovimentar = (isAdmin || isEmpresa) && !!user;

  // ── Render ──────────────────────────────────────────────────────────────────
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

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20">

        {/* ── Cabeçalho ── */}
        <div className="mb-10">
          <p className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase mb-2"
            style={{ fontFamily: "Orbitron, sans-serif" }}>
            Gestão
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: "Orbitron, sans-serif", letterSpacing: "0.04em" }}>
            Controle de Estoque
          </h1>
        </div>

        {/* ── Stats (admin) ── */}
        {isAdmin && !loading && rochas.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total de Rochas", value: stats.totalRochas, unit: "" },
              { label: "Total em Estoque", value: fmtM2(stats.totalM2), unit: "m²" },
              { label: "Sem Estoque", value: stats.semEstoque, unit: "", warn: stats.semEstoque > 0 },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-5"
                style={{
                  background: s.warn && s.value > 0 ? "rgba(251,191,36,0.06)" : "rgba(255,255,255,0.03)",
                  border: s.warn && s.value > 0 ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                <p className="text-white/30 text-xs mb-2 uppercase tracking-widest"
                  style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.6rem" }}>
                  {s.label}
                </p>
                <p className="text-2xl font-bold"
                  style={{ color: s.warn && s.value > 0 ? "#fbbf24" : "#C9A96E" }}>
                  {s.value}
                  {s.unit && <span className="text-sm font-normal text-white/30 ml-1">{s.unit}</span>}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Filtros ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25">
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Buscar por nome, tipo ou empresa…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(201,169,110,0.45)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          {isAdmin && (
            <select
              value={empresaFiltro}
              onChange={(e) => setEmpresaFiltro(e.target.value)}
              className="px-4 py-3 rounded-xl text-sm text-white/60 outline-none cursor-pointer transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                minWidth: "200px",
              }}
            >
              <option value="">Todas as empresas</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.nome}</option>
              ))}
            </select>
          )}
        </div>

        {/* Contagem */}
        {!loading && (
          <p className="text-white/25 text-xs mb-6 tracking-wide">
            {rochasFiltradas.length} {rochasFiltradas.length === 1 ? "rocha" : "rochas"}
            {busca ? " encontradas" : " no estoque"}
          </p>
        )}

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : rochasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: "rgba(201,169,110,0.07)" }}>
              <span className="text-[#C9A96E]/40"><IconSearch /></span>
            </div>
            <p className="text-white/30 text-sm">
              {busca ? "Nenhuma rocha encontrada." : "Nenhuma rocha cadastrada ainda."}
            </p>
            {busca && (
              <button onClick={() => setBusca("")}
                className="mt-3 text-[#C9A96E] text-xs hover:underline">
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {rochasFiltradas.map((rocha) => (
              <RochaCard
                key={rocha.id}
                rocha={rocha}
                podeMovimentar={podeMovimentar}
                onMovimentar={movimentar}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card de rocha ─────────────────────────────────────────────────────────────
function RochaCard({ rocha, podeMovimentar, onMovimentar }) {
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [movErr, setMovErr] = useState("");

  const saldoBaixo = (rocha.saldo || 0) < 10;
  const semEstoque = (rocha.saldo || 0) === 0;

  const toggleHistorico = async () => {
    if (!historicoOpen && historico.length === 0) {
      setLoadingHist(true);
      try {
        const snap = await getDocs(
          query(
            collection(db, "rochas", rocha.id, "estoque"),
            orderBy("criadoEm", "desc"),
            limit(10)
          )
        );
        setHistorico(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        setHistorico([]);
      } finally {
        setLoadingHist(false);
      }
    }
    setHistoricoOpen((v) => !v);
  };

  const handleMovimentar = async (tipo, m2, obs) => {
    setMovErr("");
    try {
      await onMovimentar(rocha.id, tipo, m2, obs);
      // Invalida histórico para recarregar na próxima abertura
      setHistorico([]);
      setHistoricoOpen(false);
    } catch (e) {
      setMovErr(e.message || "Erro ao movimentar.");
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: "#111111",
        border: semEstoque
          ? "1px solid rgba(248,113,113,0.2)"
          : saldoBaixo
          ? "1px solid rgba(251,191,36,0.2)"
          : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Header do card ── */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-white font-semibold truncate mb-1"
              style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.82rem", letterSpacing: "0.04em" }}
            >
              {rocha.nome}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {rocha.tipo && <TipoBadge tipo={rocha.tipo} />}
              {rocha.acabamento && (
                <span className="text-white/30 text-xs">{rocha.acabamento}</span>
              )}
            </div>
            {rocha.empresa?.nome && (
              <div className="flex items-center gap-1.5 mt-2 text-white/30 text-xs">
                <IconPin />{rocha.empresa.nome}
              </div>
            )}
          </div>

          {/* Saldo */}
          <div
            className="rounded-xl px-4 py-3 text-right flex-shrink-0"
            style={{
              background: semEstoque
                ? "rgba(248,113,113,0.08)"
                : saldoBaixo
                ? "rgba(251,191,36,0.08)"
                : "rgba(201,169,110,0.08)",
              border: semEstoque
                ? "1px solid rgba(248,113,113,0.15)"
                : saldoBaixo
                ? "1px solid rgba(251,191,36,0.15)"
                : "1px solid rgba(201,169,110,0.15)",
            }}
          >
            <p className="text-xs mb-0.5 uppercase tracking-widest"
              style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.55rem", color: "rgba(255,255,255,0.3)" }}>
              Saldo
            </p>
            <p
              className="text-2xl font-bold leading-none"
              style={{
                color: semEstoque ? "#f87171" : saldoBaixo ? "#fbbf24" : "#C9A96E",
              }}
            >
              {fmtM2(rocha.saldo)}
            </p>
            <p className="text-xs text-white/25 mt-0.5">m²</p>
          </div>
        </div>

        {/* Alerta de estoque baixo */}
        {(saldoBaixo || semEstoque) && (
          <div className="mt-3 flex items-center gap-2 text-xs"
            style={{ color: semEstoque ? "#f87171" : "#fbbf24" }}>
            <IconWarn />
            {semEstoque ? "Sem estoque disponível" : "Estoque baixo (menos de 10 m²)"}
          </div>
        )}
      </div>

      {/* ── Formulários de movimentação ── */}
      {podeMovimentar && (
        <div
          className="px-6 pb-5 grid grid-cols-2 gap-3"
        >
          <MovForm
            tipo="entrada"
            onSubmit={(m2, obs) => handleMovimentar("entrada", m2, obs)}
          />
          <MovForm
            tipo="saida"
            onSubmit={(m2, obs) => handleMovimentar("saida", m2, obs)}
          />
        </div>
      )}

      {movErr && (
        <div className="px-6 pb-4">
          <p className="text-xs text-red-400 flex items-center gap-1.5">
            <IconWarn /> {movErr}
          </p>
        </div>
      )}

      {/* ── Histórico ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <button
          onClick={toggleHistorico}
          className="w-full flex items-center justify-between px-6 py-3.5 text-white/30 hover:text-white/60 transition-colors"
        >
          <span className="flex items-center gap-2 text-xs">
            <IconHistory />
            <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em" }}>
              HISTÓRICO DE MOVIMENTAÇÕES
            </span>
          </span>
          <IconChevron open={historicoOpen} />
        </button>

        {historicoOpen && (
          <div className="px-6 pb-5">
            {loadingHist ? (
              <div className="flex items-center gap-2 text-white/25 text-xs py-3">
                <IconSpinner /> Carregando...
              </div>
            ) : historico.length === 0 ? (
              <p className="text-white/25 text-xs py-2">Nenhuma movimentação registrada.</p>
            ) : (
              <div className="space-y-2">
                {historico.map((mov) => (
                  <div
                    key={mov.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: mov.tipo === "entrada"
                            ? "rgba(74,222,128,0.1)"
                            : "rgba(248,113,113,0.1)",
                        }}
                      >
                        <span style={{ color: mov.tipo === "entrada" ? "#4ade80" : "#f87171" }}>
                          {mov.tipo === "entrada" ? <IconArrowUp /> : <IconArrowDown />}
                        </span>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs font-medium capitalize">{mov.tipo}</p>
                        {mov.obs && (
                          <p className="text-white/25 text-xs truncate max-w-[140px]">{mov.obs}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: mov.tipo === "entrada" ? "#4ade80" : "#f87171" }}
                      >
                        {mov.tipo === "entrada" ? "+" : "-"}{fmtM2(mov.m2)} m²
                      </p>
                      <p className="text-white/20 text-xs">{fmtData(mov.criadoEm)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Formulário de movimentação ────────────────────────────────────────────────
function MovForm({ tipo, onSubmit }) {
  const [m2, setM2] = useState("");
  const [obs, setObs] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const isEntrada = tipo === "entrada";

  const handle = async (e) => {
    e.preventDefault();
    if (!m2 || Number(m2) <= 0) { setMsg("Valor inválido."); return; }
    setLoading(true);
    setMsg("");
    try {
      await onSubmit(m2, obs);
      setM2(""); setObs("");
      setMsg("ok");
      setTimeout(() => setMsg(""), 2500);
    } catch (err) {
      setMsg(err.message || "Erro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handle} className="rounded-xl p-3 space-y-2"
      style={{
        background: isEntrada ? "rgba(74,222,128,0.04)" : "rgba(248,113,113,0.04)",
        border: isEntrada ? "1px solid rgba(74,222,128,0.12)" : "1px solid rgba(248,113,113,0.12)",
      }}>
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: isEntrada ? "#4ade80" : "#f87171" }}>
          {isEntrada ? <IconArrowUp /> : <IconArrowDown />}
        </span>
        <p className="text-xs font-semibold uppercase tracking-widest"
          style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.58rem", color: isEntrada ? "#4ade80" : "#f87171" }}>
          {isEntrada ? "Entrada" : "Saída"}
        </p>
      </div>

      <input
        type="number" min="0" step="0.01"
        placeholder="m²"
        value={m2}
        onChange={(e) => setM2(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/20 outline-none transition-all"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        onFocus={(e) => (e.target.style.borderColor = isEntrada ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
      />

      <input
        type="text"
        placeholder="Obs. (opcional)"
        value={obs}
        onChange={(e) => setObs(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-xs text-white placeholder-white/20 outline-none transition-all"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.2)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-40"
        style={{
          background: isEntrada ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
          color: isEntrada ? "#4ade80" : "#f87171",
          border: isEntrada ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(248,113,113,0.2)",
        }}
      >
        {loading ? <span className="flex justify-center"><IconSpinner /></span> : `Lançar ${isEntrada ? "Entrada" : "Saída"}`}
      </button>

      {msg && msg !== "ok" && (
        <p className="text-xs text-red-400 flex items-center gap-1"><IconWarn />{msg}</p>
      )}
      {msg === "ok" && (
        <p className="text-xs text-green-400 text-center">✓ Lançado!</p>
      )}
    </form>
  );
}
