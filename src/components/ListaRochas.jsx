// src/components/ListaRochas.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "./context/AuthContext";
import fundoImage from "../img/fundo.png";

// ── Ícones ────────────────────────────────────────────────────
const IconSearch = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>);
const IconClose  = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>);
const IconPlus   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>);
const IconTrash  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>);
const IconPin    = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>);
const IconBack   = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>);
const IconSpinner= () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>);

// ── Badge de tipo ─────────────────────────────────────────────
function TipoBadge({ tipo }) {
  const map = {
    granito:    "bg-amber-900/40 text-amber-300 border-amber-700/40",
    mármore:    "bg-slate-800/60 text-slate-300 border-slate-600/40",
    quartzito:  "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
    travertino: "bg-orange-900/40 text-orange-300 border-orange-700/40",
    basalto:    "bg-zinc-800/60 text-zinc-300 border-zinc-600/40",
  };
  const cls = map[(tipo||"").toLowerCase()] || "bg-white/10 text-white/60 border-white/10";
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${cls}`}>{tipo || "Rocha"}</span>;
}

// ── Skeleton ──────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-xl overflow-hidden border border-white/5 animate-pulse" style={{ background:"#111" }}>
    <div className="h-52 bg-white/5"/>
    <div className="p-5 space-y-3">
      <div className="h-5 bg-white/10 rounded w-2/3"/>
      <div className="h-3 bg-white/5 rounded w-1/3"/>
    </div>
  </div>
);

// ── InfoBox ───────────────────────────────────────────────────
function InfoBox({ label, value, highlight }) {
  return (
    <div style={{ borderRadius:"0.75rem", padding:"1rem", background: highlight?"rgba(201,169,110,0.06)":"rgba(255,255,255,0.03)", border:`1px solid ${highlight?"rgba(201,169,110,0.15)":"rgba(255,255,255,0.06)"}` }}>
      <p style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.6rem", letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"0.25rem" }}>{label}</p>
      <p style={{ fontSize:"0.875rem", fontWeight:600, color: highlight?"#C9A96E":"rgba(255,255,255,0.85)" }}>{value}</p>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function ListaRochas() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin   = profile?.role === "admin";
  const isEmpresa = profile?.role === "empresa";

  const [rochas,  setRochas]  = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtro,           setFiltro]           = useState("");
  const [tipoFiltro,       setTipoFiltro]       = useState("");
  const [acabamentoFiltro, setAcabamentoFiltro] = useState("");

  // Drawer
  const [rochaSelecionada, setRochaSelecionada] = useState(null);
  const [drawerOpen,       setDrawerOpen]       = useState(false);

  // Estoque inline
  const [m2Input,       setM2Input]       = useState("");
  const [estoqueLoading,setEstoqueLoading]= useState(false);
  const [estoqueMsg,    setEstoqueMsg]    = useState("");

  // Deleção
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Carrega rochas com join de empresa ───────────────────────
  useEffect(() => {
    const buscar = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("rochas")
        .select("*, empresas(id, nome, endereco)")
        .order("nome", { ascending: true });

      if (!error) setRochas(data || []);
      setLoading(false);
    };
    buscar();
  }, []);

  // ── Listas de filtro ─────────────────────────────────────────
  const tipos      = useMemo(() => [...new Set(rochas.map(r => r.tipo).filter(Boolean))],      [rochas]);
  const acabamentos= useMemo(() => [...new Set(rochas.map(r => r.acabamento).filter(Boolean))],[rochas]);

  // ── Aplica filtros ───────────────────────────────────────────
  const rochasFiltradas = useMemo(() => {
    const t = filtro.toLowerCase();
    return rochas.filter(r => {
      const matchTexto = !t || r.nome?.toLowerCase().includes(t) || r.tipo?.toLowerCase().includes(t) || r.empresas?.nome?.toLowerCase().includes(t);
      const matchTipo  = !tipoFiltro || r.tipo === tipoFiltro;
      const matchAcab  = !acabamentoFiltro || r.acabamento === acabamentoFiltro;
      return matchTexto && matchTipo && matchAcab;
    });
  }, [rochas, filtro, tipoFiltro, acabamentoFiltro]);

  // ── Drawer ───────────────────────────────────────────────────
  const abrirDetalhe = (rocha) => {
    setRochaSelecionada(rocha); setDrawerOpen(true);
    setM2Input(""); setEstoqueMsg(""); setConfirmDelete(false);
  };
  const fecharDetalhe = () => {
    setDrawerOpen(false);
    setTimeout(() => setRochaSelecionada(null), 350);
  };

  // Pode editar se for admin ou empresa dona
  const podeEditar = (rocha) =>
    isAdmin || (isEmpresa && profile?.companyId === rocha?.empresa_id);

  // ── Adicionar estoque ─────────────────────────────────────────
  const adicionarEstoque = async () => {
    const valor = Number(m2Input);
    if (!valor || valor <= 0) { setEstoqueMsg("Informe um valor válido."); return; }
    setEstoqueLoading(true); setEstoqueMsg("");
    try {
      // Usa a função atômica do Supabase (criada no schema)
      const { error } = await supabase.rpc("movimentar_estoque", {
        p_rocha_id: rochaSelecionada.id,
        p_tipo:     "entrada",
        p_m2:       valor,
        p_obs:      "Entrada pelo catálogo",
      });
      if (error) throw error;

      const novoEstoque = (rochaSelecionada.estoque_m2 || 0) + valor;
      const atualizada  = { ...rochaSelecionada, estoque_m2: novoEstoque };
      setRochaSelecionada(atualizada);
      setRochas(prev => prev.map(r => r.id === rochaSelecionada.id ? atualizada : r));
      setM2Input("");
      setEstoqueMsg("Estoque atualizado!");
      setTimeout(() => setEstoqueMsg(""), 3000);
    } catch (e) {
      setEstoqueMsg(e.message || "Erro ao atualizar estoque.");
    } finally {
      setEstoqueLoading(false);
    }
  };

  // ── Deletar rocha ─────────────────────────────────────────────
  const deletarRocha = async () => {
    setDeleteLoading(true);
    const { error } = await supabase.from("rochas").delete().eq("id", rochaSelecionada.id);
    if (!error) {
      setRochas(prev => prev.filter(r => r.id !== rochaSelecionada.id));
      fecharDetalhe();
    }
    setDeleteLoading(false);
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", position:"relative", backgroundImage:`url(${fundoImage})`, backgroundSize:"cover", backgroundPosition:"center", backgroundAttachment:"fixed" }}>
      <div style={{ position:"fixed", inset:0, background:"linear-gradient(to bottom,rgba(0,0,0,0.85),rgba(0,0,0,0.75) 50%,rgba(10,10,10,0.95))", pointerEvents:"none", zIndex:0 }}/>

      <div style={{ position:"relative", zIndex:10, maxWidth:"72rem", margin:"0 auto", padding:"7rem 1.5rem 5rem" }}>

        {/* Cabeçalho */}
        <div style={{ marginBottom:"2.5rem" }}>
          <p style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.6rem", letterSpacing:"0.3em", textTransform:"uppercase", color:"#C9A96E", marginBottom:"0.5rem" }}>Marketplace</p>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
            <h1 style={{ fontFamily:"Orbitron,sans-serif", fontSize:"2rem", fontWeight:700, color:"white", letterSpacing:"0.04em" }}>Rochas Ornamentais</h1>
            {(isAdmin || isEmpresa) && (
              <button onClick={() => navigate("/cadastro-rocha")}
                style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.625rem 1.25rem", borderRadius:"0.75rem", background:"linear-gradient(135deg,#C9A96E,#a07840)", color:"#0A0A0A", fontWeight:600, fontSize:"0.875rem", border:"none", cursor:"pointer", boxShadow:"0 0 20px rgba(201,169,110,0.25)" }}>
                <IconPlus/> Cadastrar Rocha
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.75rem", marginBottom:"1.5rem" }}>
          <div style={{ position:"relative", flex:1, minWidth:"200px" }}>
            <span style={{ position:"absolute", left:"0.875rem", top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.25)", pointerEvents:"none" }}><IconSearch/></span>
            <input type="text" placeholder="Buscar por nome, tipo ou empresa…" value={filtro} onChange={e=>setFiltro(e.target.value)}
              style={{ width:"100%", paddingLeft:"2.5rem", paddingRight:"1rem", paddingTop:"0.75rem", paddingBottom:"0.75rem", borderRadius:"0.75rem", fontSize:"0.875rem", color:"white", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", outline:"none" }}
              onFocus={e=>(e.target.style.borderColor="rgba(201,169,110,0.5)")} onBlur={e=>(e.target.style.borderColor="rgba(255,255,255,0.08)")}/>
          </div>
          {[{ value:tipoFiltro, onChange:e=>setTipoFiltro(e.target.value), placeholder:"Todos os tipos", options:tipos },
            { value:acabamentoFiltro, onChange:e=>setAcabamentoFiltro(e.target.value), placeholder:"Todos os acabamentos", options:acabamentos }]
            .map((sel,i) => (
            <select key={i} value={sel.value} onChange={sel.onChange}
              style={{ padding:"0.75rem 1rem", borderRadius:"0.75rem", fontSize:"0.875rem", color:"rgba(255,255,255,0.7)", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", outline:"none", cursor:"pointer", minWidth:"160px" }}>
              <option value="">{sel.placeholder}</option>
              {sel.options.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          ))}
        </div>

        {/* Contagem */}
        {!loading && <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.75rem", marginBottom:"1.5rem" }}>{rochasFiltradas.length} {rochasFiltradas.length===1?"rocha encontrada":"rochas encontradas"}</p>}

        {/* Grid */}
        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"1.25rem" }}>
            {[...Array(6)].map((_,i)=><SkeletonCard key={i}/>)}
          </div>
        ) : rochasFiltradas.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"8rem 0", textAlign:"center" }}>
            <div style={{ width:"4rem", height:"4rem", borderRadius:"50%", background:"rgba(201,169,110,0.07)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem" }}>
              <span style={{ color:"rgba(201,169,110,0.4)" }}><IconSearch/></span>
            </div>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.875rem" }}>Nenhuma rocha encontrada.</p>
            {(filtro||tipoFiltro||acabamentoFiltro) && (
              <button onClick={()=>{setFiltro("");setTipoFiltro("");setAcabamentoFiltro("");}} style={{ marginTop:"0.75rem", color:"#C9A96E", fontSize:"0.75rem", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>Limpar filtros</button>
            )}
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"1.25rem" }}>
            {rochasFiltradas.map(rocha=><RochaCard key={rocha.id} rocha={rocha} onClick={()=>abrirDetalhe(rocha)}/>)}
          </div>
        )}
      </div>

      {/* Backdrop */}
      <div onClick={fecharDetalhe} style={{ position:"fixed", inset:0, zIndex:40, transition:"all 0.35s", background:drawerOpen?"rgba(0,0,0,0.7)":"transparent", backdropFilter:drawerOpen?"blur(4px)":"none", pointerEvents:drawerOpen?"auto":"none" }}/>

      {/* Drawer */}
      <div style={{ position:"fixed", top:0, right:0, height:"100%", zIndex:50, overflowY:"auto", width:"min(520px,100vw)", background:"#0E0E0E", borderLeft:"1px solid rgba(255,255,255,0.07)", transform:drawerOpen?"translateX(0)":"translateX(100%)", transition:"transform 0.35s cubic-bezier(0.4,0,0.2,1)", boxShadow:drawerOpen?"-20px 0 60px rgba(0,0,0,0.6)":"none" }}>
        {rochaSelecionada && (
          <DetalheRocha
            rocha={rochaSelecionada}
            podeEditar={podeEditar(rochaSelecionada)}
            m2Input={m2Input} setM2Input={setM2Input}
            estoqueLoading={estoqueLoading} estoqueMsg={estoqueMsg}
            adicionarEstoque={adicionarEstoque}
            confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete}
            deleteLoading={deleteLoading} deletarRocha={deletarRocha}
            onClose={fecharDetalhe}
          />
        )}
      </div>
    </div>
  );
}

// ── Card de rocha ─────────────────────────────────────────────
function RochaCard({ rocha, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ borderRadius:"0.875rem", overflow:"hidden", cursor:"pointer", background:"#111111", border:hover?"1px solid rgba(201,169,110,0.35)":"1px solid rgba(255,255,255,0.06)", transform:hover?"translateY(-4px)":"translateY(0)", boxShadow:hover?"0 16px 48px rgba(0,0,0,0.5)":"0 2px 8px rgba(0,0,0,0.3)", transition:"all 0.3s" }}>
      <div style={{ position:"relative", height:"13rem", background:"rgba(255,255,255,0.04)", overflow:"hidden" }}>
        {rocha.foto_url
          ? <img src={rocha.foto_url} alt={rocha.nome} style={{ width:"100%", height:"100%", objectFit:"cover", transform:hover?"scale(1.06)":"scale(1)", transition:"transform 0.5s" }}/>
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:"3rem", color:"rgba(255,255,255,0.06)" }}>◈</span></div>}
        {rocha.tipo && <div style={{ position:"absolute", top:"0.75rem", left:"0.75rem" }}><TipoBadge tipo={rocha.tipo}/></div>}
        {rocha.estoque_m2 != null && (
          <div style={{ position:"absolute", top:"0.75rem", right:"0.75rem", padding:"0.125rem 0.5rem", borderRadius:"0.375rem", fontSize:"0.7rem", background:"rgba(0,0,0,0.65)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.7)" }}>
            {rocha.estoque_m2} m²
          </div>
        )}
      </div>
      <div style={{ padding:"1.25rem" }}>
        <h3 style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.82rem", fontWeight:700, letterSpacing:"0.04em", color:hover?"#C9A96E":"white", transition:"color 0.3s", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:"0.375rem" }}>{rocha.nome}</h3>
        <div style={{ display:"flex", alignItems:"center", gap:"0.375rem", color:"rgba(255,255,255,0.35)", fontSize:"0.75rem", overflow:"hidden" }}>
          <IconPin/><span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{rocha.empresas?.nome || "—"}</span>
        </div>
        {rocha.acabamento && <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.72rem", marginTop:"0.375rem" }}>Acabamento: {rocha.acabamento}</p>}
        <div style={{ marginTop:"1rem", display:"flex", alignItems:"center", gap:"0.25rem", fontSize:"0.65rem", letterSpacing:"0.1em", textTransform:"uppercase", color:hover?"#C9A96E":"rgba(255,255,255,0.2)", transition:"color 0.3s" }}>
          Ver detalhes <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round"/></svg>
        </div>
      </div>
    </div>
  );
}

// ── Detalhe (drawer) ──────────────────────────────────────────
function DetalheRocha({ rocha, podeEditar, m2Input, setM2Input, estoqueLoading, estoqueMsg, adicionarEstoque, confirmDelete, setConfirmDelete, deleteLoading, deletarRocha, onClose }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.25rem 1.5rem", borderBottom:"1px solid rgba(255,255,255,0.06)", position:"sticky", top:0, background:"#0E0E0E", zIndex:10 }}>
        <button onClick={onClose} style={{ display:"flex", alignItems:"center", gap:"0.5rem", color:"rgba(255,255,255,0.35)", background:"none", border:"none", cursor:"pointer", fontSize:"0.8rem" }}>
          <IconBack/> Voltar
        </button>
        <span style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.2)" }}>Detalhe</span>
        <button onClick={onClose} style={{ width:"2rem", height:"2rem", borderRadius:"0.5rem", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", cursor:"pointer", color:"rgba(255,255,255,0.35)" }}>
          <IconClose/>
        </button>
      </div>

      {/* Foto */}
      <div style={{ position:"relative", height:"260px", background:"#0A0A0A", flexShrink:0 }}>
        {rocha.foto_url
          ? <img src={rocha.foto_url} alt={rocha.nome} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:"6rem", color:"rgba(255,255,255,0.04)" }}>◈</span></div>}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,#0E0E0E,transparent)" }}/>
      </div>

      {/* Conteúdo */}
      <div style={{ padding:"1.5rem", flex:1 }}>
        <h2 style={{ fontFamily:"Orbitron,sans-serif", fontSize:"1.4rem", fontWeight:700, color:"white", letterSpacing:"0.04em", marginBottom:"0.75rem" }}>{rocha.nome}</h2>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", marginBottom:"1.5rem" }}>
          {rocha.tipo && <TipoBadge tipo={rocha.tipo}/>}
          {rocha.acabamento && <span style={{ padding:"0.125rem 0.625rem", borderRadius:"9999px", fontSize:"0.7rem", background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.5)", border:"1px solid rgba(255,255,255,0.1)" }}>{rocha.acabamento}</span>}
        </div>

        <div style={{ height:"1px", background:"rgba(255,255,255,0.06)", marginBottom:"1.5rem" }}/>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem", marginBottom:"1.5rem" }}>
          <InfoBox label="Empresa"   value={rocha.empresas?.nome || "—"}/>
          <InfoBox label="Estoque"   value={`${rocha.estoque_m2 ?? 0} m²`} highlight/>
          {rocha.tipo       && <InfoBox label="Tipo"       value={rocha.tipo}/>}
          {rocha.acabamento && <InfoBox label="Acabamento" value={rocha.acabamento}/>}
        </div>

        {/* Gerenciar estoque */}
        {podeEditar && (
          <>
            <div style={{ height:"1px", background:"rgba(255,255,255,0.06)", marginBottom:"1.5rem" }}/>
            <p style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", marginBottom:"0.75rem" }}>Gerenciar Estoque</p>
            <div style={{ display:"flex", gap:"0.5rem", marginBottom:"0.5rem" }}>
              <input type="number" placeholder="m² a adicionar" value={m2Input} onChange={e=>setM2Input(e.target.value)} min="0" step="0.01"
                style={{ flex:1, padding:"0.625rem 0.875rem", borderRadius:"0.75rem", fontSize:"0.875rem", color:"white", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", outline:"none" }}
                onFocus={e=>(e.target.style.borderColor="rgba(201,169,110,0.4)")} onBlur={e=>(e.target.style.borderColor="rgba(255,255,255,0.1)")}/>
              <button onClick={adicionarEstoque} disabled={estoqueLoading}
                style={{ display:"flex", alignItems:"center", gap:"0.375rem", padding:"0.625rem 1rem", borderRadius:"0.75rem", fontSize:"0.875rem", fontWeight:600, background:"rgba(201,169,110,0.15)", color:"#C9A96E", border:"1px solid rgba(201,169,110,0.2)", cursor:"pointer", opacity:estoqueLoading?0.5:1 }}>
                {estoqueLoading?<IconSpinner/>:<IconPlus/>} Adicionar
              </button>
            </div>
            {estoqueMsg && <p style={{ fontSize:"0.75rem", color:estoqueMsg.includes("Erro")?"#f87171":"#86efac" }}>{estoqueMsg}</p>}

            <div style={{ height:"1px", background:"rgba(255,255,255,0.06)", margin:"1.5rem 0" }}/>

            {!confirmDelete ? (
              <button onClick={()=>setConfirmDelete(true)} style={{ display:"flex", alignItems:"center", gap:"0.5rem", color:"rgba(248,113,113,0.6)", background:"none", border:"none", cursor:"pointer", fontSize:"0.875rem" }}
                onMouseEnter={e=>(e.currentTarget.style.color="#f87171")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(248,113,113,0.6)")}>
                <IconTrash/> Excluir esta rocha
              </button>
            ) : (
              <div style={{ borderRadius:"0.875rem", padding:"1rem", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)" }}>
                <p style={{ color:"#f87171", fontSize:"0.875rem", marginBottom:"0.75rem" }}>Tem certeza? Esta ação não pode ser desfeita.</p>
                <div style={{ display:"flex", gap:"0.5rem" }}>
                  <button onClick={()=>setConfirmDelete(false)} style={{ flex:1, padding:"0.5rem", borderRadius:"0.625rem", fontSize:"0.875rem", color:"rgba(255,255,255,0.5)", background:"none", border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer" }}>Cancelar</button>
                  <button onClick={deletarRocha} disabled={deleteLoading} style={{ flex:1, padding:"0.5rem", borderRadius:"0.625rem", fontSize:"0.875rem", fontWeight:600, color:"white", background:"#dc2626", border:"none", cursor:"pointer", opacity:deleteLoading?0.5:1 }}>
                    {deleteLoading?"Excluindo…":"Confirmar exclusão"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Mapa */}
        {rocha.empresas?.endereco && (
          <>
            <div style={{ height:"1px", background:"rgba(255,255,255,0.06)", margin:"1.5rem 0" }}/>
            <p style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", marginBottom:"0.75rem" }}>Localização</p>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.75rem", marginBottom:"0.75rem" }}>{rocha.empresas.endereco}</p>
            <div style={{ borderRadius:"0.875rem", overflow:"hidden", border:"1px solid rgba(255,255,255,0.07)", height:"240px" }}>
              <iframe title="mapa" width="100%" height="100%" style={{ border:0, filter:"grayscale(80%) brightness(0.7)" }} loading="lazy" allowFullScreen
                src={`https://www.google.com/maps?q=${encodeURIComponent(rocha.empresas.endereco)}&output=embed`}/>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
