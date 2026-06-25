// src/components/Pages/Estoque.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabase";
import { useAuth } from "../context/AuthContext";
import fundoImage from "../../img/fundo.png";

// ── Ícones ────────────────────────────────────────────────────
const IconSearch   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>);
const IconArrowUp  = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>);
const IconArrowDown= () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>);
const IconHistory  = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>);
const IconChevron  = ({ open }) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transform:open?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.25s" }}><polyline points="6 9 12 15 18 9"/></svg>);
const IconSpinner  = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>);
const IconWarn     = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IconPin      = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>);

// ── Helpers ───────────────────────────────────────────────────
const fmtM2   = (v) => Number(v ?? 0).toFixed(2);
const fmtData = (val) => {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("pt-BR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
};

// ── Badge de tipo ─────────────────────────────────────────────
function TipoBadge({ tipo }) {
  const map = {
    granito:    "bg-amber-900/30 text-amber-300/80 border-amber-700/30",
    mármore:    "bg-slate-800/50 text-slate-300/80 border-slate-600/30",
    quartzito:  "bg-emerald-900/30 text-emerald-300/80 border-emerald-700/30",
    travertino: "bg-orange-900/30 text-orange-300/80 border-orange-700/30",
    basalto:    "bg-zinc-800/50 text-zinc-300/80 border-zinc-600/30",
  };
  const cls = map[(tipo||"").toLowerCase()] || "bg-white/5 text-white/40 border-white/10";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border capitalize ${cls}`}>{tipo||"—"}</span>;
}

// ── Skeleton ──────────────────────────────────────────────────
const SkeletonCard = () => (
  <div style={{ borderRadius:"1rem", border:"1px solid rgba(255,255,255,0.05)", background:"#111", overflow:"hidden" }} className="animate-pulse">
    <div style={{ padding:"1.5rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", flex:1 }}>
          <div style={{ height:"1rem", background:"rgba(255,255,255,0.08)", borderRadius:"0.5rem", width:"50%" }}/>
          <div style={{ height:"0.75rem", background:"rgba(255,255,255,0.05)", borderRadius:"0.5rem", width:"35%" }}/>
        </div>
        <div style={{ height:"3rem", width:"5rem", background:"rgba(255,255,255,0.05)", borderRadius:"0.75rem" }}/>
      </div>
      <div style={{ height:"1px", background:"rgba(255,255,255,0.05)" }}/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
        <div style={{ height:"5rem", background:"rgba(255,255,255,0.05)", borderRadius:"0.75rem" }}/>
        <div style={{ height:"5rem", background:"rgba(255,255,255,0.05)", borderRadius:"0.75rem" }}/>
      </div>
    </div>
  </div>
);

// ── Componente principal ──────────────────────────────────────
export default function Estoque() {
  const { user, profile } = useAuth();
  const isAdmin   = profile?.role === "admin";
  const isEmpresa = profile?.role === "empresa";
  const companyId = profile?.companyId || null;

  const [rochas,       setRochas]       = useState([]);
  const [empresas,     setEmpresas]     = useState([]);
  const [empresaFiltro,setEmpresaFiltro]= useState("");
  const [busca,        setBusca]        = useState("");
  const [loading,      setLoading]      = useState(true);

  // ── Carrega empresas (só admin) ──────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("empresas").select("id, nome").order("nome").then(({ data }) => {
      setEmpresas(data || []);
    });
  }, [isAdmin]);

  // ── Carrega rochas ────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let q = supabase
        .from("rochas")
        .select("*, empresas(id, nome)")
        .order("nome", { ascending: true });

      if (isAdmin && empresaFiltro) {
        q = q.eq("empresa_id", empresaFiltro);
      } else if (isEmpresa && companyId) {
        q = q.eq("empresa_id", companyId);
      } else if (!isAdmin) {
        setRochas([]); setLoading(false); return;
      }

      const { data, error } = await q;
      if (!error) setRochas(data || []);
      setLoading(false);
    };
    load();
  }, [isAdmin, isEmpresa, companyId, empresaFiltro]);

  // ── Filtro de busca ───────────────────────────────────────────
  const rochasFiltradas = useMemo(() => {
    const t = busca.toLowerCase();
    if (!t) return rochas;
    return rochas.filter(r =>
      r.nome?.toLowerCase().includes(t) ||
      r.tipo?.toLowerCase().includes(t) ||
      r.empresas?.nome?.toLowerCase().includes(t)
    );
  }, [rochas, busca]);

  // ── Estatísticas (admin) ──────────────────────────────────────
  const stats = useMemo(() => ({
    totalRochas: rochas.length,
    totalM2:     rochas.reduce((acc, r) => acc + (r.estoque_m2 || 0), 0),
    semEstoque:  rochas.filter(r => (r.estoque_m2 || 0) === 0).length,
  }), [rochas]);

  // ── Movimentar estoque ────────────────────────────────────────
  const movimentar = async (rochaId, tipo, m2, obs = "") => {
    const valor = Number(m2);
    if (!valor || valor <= 0 || !user?.uid) return;

    // Usa a função atômica criada no schema SQL
    const { error } = await supabase.rpc("movimentar_estoque", {
      p_rocha_id: rochaId,
      p_tipo:     tipo,
      p_m2:       valor,
      p_obs:      obs || null,
    });

    if (error) throw new Error(error.message);

    // Atualiza estado local
    setRochas(prev => prev.map(r => {
      if (r.id !== rochaId) return r;
      const novoEstoque = tipo === "entrada"
        ? (r.estoque_m2 || 0) + valor
        : (r.estoque_m2 || 0) - valor;
      return { ...r, estoque_m2: novoEstoque };
    }));
  };

  const podeMovimentar = (isAdmin || isEmpresa) && !!user;

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", position:"relative", backgroundImage:`url(${fundoImage})`, backgroundSize:"cover", backgroundPosition:"center", backgroundAttachment:"fixed" }}>
      <div style={{ position:"fixed", inset:0, background:"linear-gradient(to bottom,rgba(0,0,0,0.85),rgba(0,0,0,0.75) 50%,rgba(10,10,10,0.95))", pointerEvents:"none", zIndex:0 }}/>

      <div style={{ position:"relative", zIndex:10, maxWidth:"72rem", margin:"0 auto", padding:"7rem 1.5rem 5rem" }}>

        {/* Cabeçalho */}
        <div style={{ marginBottom:"2.5rem" }}>
          <p style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.6rem", letterSpacing:"0.3em", textTransform:"uppercase", color:"#C9A96E", marginBottom:"0.5rem" }}>Gestão</p>
          <h1 style={{ fontFamily:"Orbitron,sans-serif", fontSize:"2rem", fontWeight:700, color:"white", letterSpacing:"0.04em" }}>Controle de Estoque</h1>
        </div>

        {/* Stats (admin) */}
        {isAdmin && !loading && rochas.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"2rem" }}>
            {[
              { label:"Total de Rochas", value:stats.totalRochas, unit:"",   warn:false },
              { label:"Total em Estoque", value:fmtM2(stats.totalM2), unit:"m²", warn:false },
              { label:"Sem Estoque",      value:stats.semEstoque,    unit:"",   warn:stats.semEstoque>0 },
            ].map(s => (
              <div key={s.label} style={{ borderRadius:"1rem", padding:"1.25rem", background:s.warn&&s.value>0?"rgba(251,191,36,0.06)":"rgba(255,255,255,0.03)", border:`1px solid ${s.warn&&s.value>0?"rgba(251,191,36,0.2)":"rgba(255,255,255,0.06)"}` }}>
                <p style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"0.5rem" }}>{s.label}</p>
                <p style={{ fontSize:"1.5rem", fontWeight:700, color:s.warn&&s.value>0?"#fbbf24":"#C9A96E" }}>
                  {s.value}{s.unit&&<span style={{ fontSize:"0.875rem", fontWeight:400, color:"rgba(255,255,255,0.3)", marginLeft:"0.25rem" }}>{s.unit}</span>}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.75rem", marginBottom:"1.5rem" }}>
          <div style={{ position:"relative", flex:1, minWidth:"200px" }}>
            <span style={{ position:"absolute", left:"0.875rem", top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.25)", pointerEvents:"none" }}><IconSearch/></span>
            <input type="text" placeholder="Buscar por nome, tipo ou empresa…" value={busca} onChange={e=>setBusca(e.target.value)}
              style={{ width:"100%", paddingLeft:"2.5rem", paddingRight:"1rem", paddingTop:"0.75rem", paddingBottom:"0.75rem", borderRadius:"0.75rem", fontSize:"0.875rem", color:"white", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", outline:"none" }}
              onFocus={e=>(e.target.style.borderColor="rgba(201,169,110,0.5)")} onBlur={e=>(e.target.style.borderColor="rgba(255,255,255,0.08)")}/>
          </div>
          {isAdmin && (
            <select value={empresaFiltro} onChange={e=>setEmpresaFiltro(e.target.value)}
              style={{ padding:"0.75rem 1rem", borderRadius:"0.75rem", fontSize:"0.875rem", color:"rgba(255,255,255,0.6)", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", outline:"none", cursor:"pointer", minWidth:"200px" }}>
              <option value="">Todas as empresas</option>
              {empresas.map(emp=><option key={emp.id} value={emp.id}>{emp.nome}</option>)}
            </select>
          )}
        </div>

        {/* Contagem */}
        {!loading && (
          <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.75rem", marginBottom:"1.5rem" }}>
            {rochasFiltradas.length} {rochasFiltradas.length===1?"rocha":"rochas"}{busca?" encontradas":" no estoque"}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:"1.25rem" }}>
            {[...Array(4)].map((_,i)=><SkeletonCard key={i}/>)}
          </div>
        ) : rochasFiltradas.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"8rem 0", textAlign:"center" }}>
            <div style={{ width:"3.5rem", height:"3.5rem", borderRadius:"50%", background:"rgba(201,169,110,0.07)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem" }}>
              <span style={{ color:"rgba(201,169,110,0.4)" }}><IconSearch/></span>
            </div>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.875rem" }}>{busca?"Nenhuma rocha encontrada.":"Nenhuma rocha cadastrada ainda."}</p>
            {busca && <button onClick={()=>setBusca("")} style={{ marginTop:"0.75rem", color:"#C9A96E", fontSize:"0.75rem", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>Limpar busca</button>}
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:"1.25rem" }}>
            {rochasFiltradas.map(rocha=>(
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

// ── Card de rocha ─────────────────────────────────────────────
function RochaCard({ rocha, podeMovimentar, onMovimentar }) {
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [historico,     setHistorico]     = useState([]);
  const [loadingHist,   setLoadingHist]   = useState(false);
  const [movErr,        setMovErr]        = useState("");

  const saldoBaixo = (rocha.estoque_m2 || 0) < 10;
  const semEstoque = (rocha.estoque_m2 || 0) === 0;

  // ── Carrega histórico (Supabase) ──────────────────────────
  const toggleHistorico = async () => {
    if (!historicoOpen && historico.length === 0) {
      setLoadingHist(true);
      const { data } = await supabase
        .from("movimentacoes")
        .select("*")
        .eq("rocha_id", rocha.id)
        .order("criado_em", { ascending: false })
        .limit(10);
      setHistorico(data || []);
      setLoadingHist(false);
    }
    setHistoricoOpen(v => !v);
  };

  const handleMovimentar = async (tipo, m2, obs) => {
    setMovErr("");
    try {
      await onMovimentar(rocha.id, tipo, m2, obs);
      setHistorico([]); // invalida cache do histórico
      setHistoricoOpen(false);
    } catch (e) {
      setMovErr(e.message || "Erro ao movimentar.");
    }
  };

  const borderColor = semEstoque
    ? "rgba(248,113,113,0.2)"
    : saldoBaixo
    ? "rgba(251,191,36,0.2)"
    : "rgba(255,255,255,0.06)";

  return (
    <div style={{ borderRadius:"1rem", overflow:"hidden", background:"#111111", border:`1px solid ${borderColor}`, transition:"all 0.3s" }}>

      {/* Cabeçalho do card */}
      <div style={{ padding:"1.5rem" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem" }}>
          {/* Info */}
          <div style={{ flex:1, minWidth:0 }}>
            <h3 style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.82rem", fontWeight:700, letterSpacing:"0.04em", color:"white", marginBottom:"0.5rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {rocha.nome}
            </h3>
            <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:"0.5rem" }}>
              {rocha.tipo && <TipoBadge tipo={rocha.tipo}/>}
              {rocha.acabamento && <span style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.72rem" }}>{rocha.acabamento}</span>}
            </div>
            {rocha.empresas?.nome && (
              <div style={{ display:"flex", alignItems:"center", gap:"0.375rem", marginTop:"0.5rem", color:"rgba(255,255,255,0.3)", fontSize:"0.72rem" }}>
                <IconPin/>{rocha.empresas.nome}
              </div>
            )}
          </div>

          {/* Saldo */}
          <div style={{ borderRadius:"0.875rem", padding:"0.875rem 1rem", textAlign:"right", flexShrink:0, background:semEstoque?"rgba(248,113,113,0.08)":saldoBaixo?"rgba(251,191,36,0.08)":"rgba(201,169,110,0.08)", border:`1px solid ${semEstoque?"rgba(248,113,113,0.15)":saldoBaixo?"rgba(251,191,36,0.15)":"rgba(201,169,110,0.15)"}` }}>
            <p style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.55rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"0.25rem" }}>Saldo</p>
            <p style={{ fontSize:"1.5rem", fontWeight:700, lineHeight:1, color:semEstoque?"#f87171":saldoBaixo?"#fbbf24":"#C9A96E" }}>
              {fmtM2(rocha.estoque_m2)}
            </p>
            <p style={{ fontSize:"0.65rem", color:"rgba(255,255,255,0.25)", marginTop:"0.25rem" }}>m²</p>
          </div>
        </div>

        {/* Alerta de estoque baixo */}
        {(saldoBaixo || semEstoque) && (
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginTop:"0.875rem", fontSize:"0.75rem", color:semEstoque?"#f87171":"#fbbf24" }}>
            <IconWarn/>{semEstoque?"Sem estoque disponível":"Estoque baixo (menos de 10 m²)"}
          </div>
        )}
      </div>

      {/* Formulários de movimentação */}
      {podeMovimentar && (
        <div style={{ padding:"0 1.5rem 1.5rem", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
          <MovForm tipo="entrada" onSubmit={(m2,obs)=>handleMovimentar("entrada",m2,obs)}/>
          <MovForm tipo="saida"   onSubmit={(m2,obs)=>handleMovimentar("saida",m2,obs)}/>
        </div>
      )}

      {movErr && (
        <div style={{ padding:"0 1.5rem 1rem" }}>
          <p style={{ fontSize:"0.75rem", color:"#f87171", display:"flex", alignItems:"center", gap:"0.375rem" }}><IconWarn/>{movErr}</p>
        </div>
      )}

      {/* Histórico */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={toggleHistorico}
          style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.875rem 1.5rem", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3)" }}
          onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.6)")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.3)")}>
          <span style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.65rem" }}>
            <IconHistory/>
            <span style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.6rem", letterSpacing:"0.1em" }}>HISTÓRICO DE MOVIMENTAÇÕES</span>
          </span>
          <IconChevron open={historicoOpen}/>
        </button>

        {historicoOpen && (
          <div style={{ padding:"0 1.5rem 1.5rem" }}>
            {loadingHist ? (
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", color:"rgba(255,255,255,0.25)", fontSize:"0.75rem", padding:"0.75rem 0" }}>
                <IconSpinner/> Carregando...
              </div>
            ) : historico.length === 0 ? (
              <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.75rem", padding:"0.5rem 0" }}>Nenhuma movimentação registrada.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                {historico.map(mov => (
                  <div key={mov.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.625rem 0.875rem", borderRadius:"0.75rem", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                      <div style={{ width:"1.75rem", height:"1.75rem", borderRadius:"0.5rem", display:"flex", alignItems:"center", justifyContent:"center", background:mov.tipo==="entrada"?"rgba(74,222,128,0.1)":"rgba(248,113,113,0.1)" }}>
                        <span style={{ color:mov.tipo==="entrada"?"#4ade80":"#f87171" }}>
                          {mov.tipo==="entrada"?<IconArrowUp/>:<IconArrowDown/>}
                        </span>
                      </div>
                      <div>
                        <p style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.75rem", fontWeight:500, textTransform:"capitalize" }}>{mov.tipo}</p>
                        {mov.obs && <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.7rem", maxWidth:"140px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{mov.obs}</p>}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ fontSize:"0.875rem", fontWeight:600, color:mov.tipo==="entrada"?"#4ade80":"#f87171" }}>
                        {mov.tipo==="entrada"?"+":"-"}{fmtM2(mov.m2)} m²
                      </p>
                      <p style={{ color:"rgba(255,255,255,0.2)", fontSize:"0.65rem" }}>{fmtData(mov.criado_em)}</p>
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

// ── Formulário de movimentação ────────────────────────────────
function MovForm({ tipo, onSubmit }) {
  const [m2,      setM2]      = useState("");
  const [obs,     setObs]     = useState("");
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");

  const isEntrada = tipo === "entrada";

  const handle = async (e) => {
    e.preventDefault();
    if (!m2 || Number(m2) <= 0) { setMsg("Valor inválido."); return; }
    setLoading(true); setMsg("");
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
    <form onSubmit={handle} style={{ borderRadius:"0.75rem", padding:"0.75rem", background:isEntrada?"rgba(74,222,128,0.04)":"rgba(248,113,113,0.04)", border:`1px solid ${isEntrada?"rgba(74,222,128,0.12)":"rgba(248,113,113,0.12)"}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.625rem" }}>
        <span style={{ color:isEntrada?"#4ade80":"#f87171" }}>{isEntrada?<IconArrowUp/>:<IconArrowDown/>}</span>
        <p style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.58rem", letterSpacing:"0.15em", textTransform:"uppercase", color:isEntrada?"#4ade80":"#f87171", fontWeight:600 }}>
          {isEntrada?"Entrada":"Saída"}
        </p>
      </div>

      <input type="number" min="0" step="0.01" placeholder="m²" value={m2} onChange={e=>setM2(e.target.value)}
        style={{ width:"100%", padding:"0.5rem 0.75rem", borderRadius:"0.625rem", fontSize:"0.875rem", color:"white", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", outline:"none", marginBottom:"0.5rem", boxSizing:"border-box" }}
        onFocus={e=>(e.target.style.borderColor=isEntrada?"rgba(74,222,128,0.4)":"rgba(248,113,113,0.4)")} onBlur={e=>(e.target.style.borderColor="rgba(255,255,255,0.08)")}/>

      <input type="text" placeholder="Obs. (opcional)" value={obs} onChange={e=>setObs(e.target.value)}
        style={{ width:"100%", padding:"0.5rem 0.75rem", borderRadius:"0.625rem", fontSize:"0.75rem", color:"white", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", outline:"none", marginBottom:"0.625rem", boxSizing:"border-box" }}
        onFocus={e=>(e.target.style.borderColor="rgba(255,255,255,0.2)")} onBlur={e=>(e.target.style.borderColor="rgba(255,255,255,0.08)")}/>

      <button type="submit" disabled={loading}
        style={{ width:"100%", padding:"0.5rem", borderRadius:"0.625rem", fontSize:"0.72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", background:isEntrada?"rgba(74,222,128,0.15)":"rgba(248,113,113,0.15)", color:isEntrada?"#4ade80":"#f87171", border:`1px solid ${isEntrada?"rgba(74,222,128,0.2)":"rgba(248,113,113,0.2)"}`, cursor:"pointer", opacity:loading?0.5:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {loading?<IconSpinner/>:`Lançar ${isEntrada?"Entrada":"Saída"}`}
      </button>

      {msg && msg!=="ok" && <p style={{ fontSize:"0.7rem", color:"#f87171", marginTop:"0.375rem", display:"flex", alignItems:"center", gap:"0.25rem" }}><IconWarn/>{msg}</p>}
      {msg==="ok"         && <p style={{ fontSize:"0.7rem", color:"#4ade80", marginTop:"0.375rem", textAlign:"center" }}>✓ Lançado!</p>}
    </form>
  );
}
