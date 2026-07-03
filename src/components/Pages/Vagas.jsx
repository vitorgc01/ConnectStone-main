// src/components/Pages/Vagas.jsx
import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../supabase";
import { useAuth } from "../context/AuthContext";
import fundoImage from "../../img/fundo.png";

// ── Ícones ────────────────────────────────────────────────────
const IconPlus    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>);
const IconTrash   = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>);
const IconMail    = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const IconClose   = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>);
const IconSpinner = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>);
const IconWarn    = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IconBriefcase=()=>(<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>);
const IconPin     = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>);

export default function Vagas() {
  const { user, profile } = useAuth();
  const isAdmin   = profile?.role === "admin";
  const isEmpresa = profile?.role === "empresa";

  const [vagas,        setVagas]        = useState([]);
  const [empresasMap,  setEmpresasMap]  = useState({});
  const [empresasList, setEmpresasList] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [busca,        setBusca]        = useState("");

  // Modal
  const [modalOpen,  setModalOpen]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [statusMsg,  setStatusMsg]  = useState("");
  const [form, setForm] = useState({ empresa_id:"", cargo:"", descricao:"", contato_email:"" });

  const podePublicar = !!user && (isAdmin || isEmpresa);

  // ── Carrega empresas e vagas ──────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Empresas (para o map de nomes e o select do admin)
        const { data: emps } = await supabase.from("empresas").select("id, nome").order("nome");
        const map = {};
        (emps || []).forEach(e => (map[e.id] = e.nome));
        setEmpresasMap(map);
        setEmpresasList(emps || []);

        // Vagas ativas com join de empresa
        const { data: vagasData } = await supabase
          .from("vagas")
          .select("*, empresas(id, nome)")
          .eq("ativa", true)
          .order("publicada_em", { ascending: false });

        setVagas(vagasData || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Filtro de busca ───────────────────────────────────────
  const vagasFiltradas = useMemo(() => {
    const t = busca.toLowerCase();
    if (!t) return vagas;
    return vagas.filter(v =>
      v.cargo?.toLowerCase().includes(t) ||
      v.descricao?.toLowerCase().includes(t) ||
      v.empresas?.nome?.toLowerCase().includes(t)
    );
  }, [vagas, busca]);

  // ── Abre modal ────────────────────────────────────────────
  const abrirModal = () => {
    setForm({
      empresa_id:    isEmpresa ? profile?.companyId || "" : "",
      cargo:         "",
      descricao:     "",
      contato_email: "",
    });
    setStatusMsg("");
    setModalOpen(true);
  };

  // ── Salva vaga ────────────────────────────────────────────
  const salvarVaga = async (e) => {
    e.preventDefault();
    setStatusMsg(""); setSaving(true);

    const finalEmpresaId = isEmpresa ? profile?.companyId : form.empresa_id;
    if (!finalEmpresaId) { setStatusMsg("Selecione uma empresa."); setSaving(false); return; }

    const { data, error } = await supabase
      .from("vagas")
      .insert({
        empresa_id:    finalEmpresaId,
        cargo:         form.cargo,
        descricao:     form.descricao,
        contato_email: form.contato_email,
        ativa:         true,
        publicada_em:  new Date().toISOString(),
      })
      .select("*, empresas(id, nome)")
      .single();

    if (error) {
      setStatusMsg("Erro ao salvar vaga. Verifique as permissões."); setSaving(false); return;
    }

    setVagas(prev => [data, ...prev]);
    setStatusMsg("Vaga publicada!");
    setTimeout(() => setModalOpen(false), 700);
    setSaving(false);
  };

  // ── Exclui vaga ───────────────────────────────────────────
  const excluirVaga = async (vagaId) => {
    const { error } = await supabase.from("vagas").delete().eq("id", vagaId);
    if (!error) setVagas(prev => prev.filter(v => v.id !== vagaId));
  };

  const canDelete = (vaga) =>
    isAdmin || (isEmpresa && vaga.empresa_id === profile?.companyId);

  return (
    <div style={{ minHeight:"100vh", position:"relative", backgroundImage:`url(${fundoImage})`, backgroundSize:"cover", backgroundPosition:"center", backgroundAttachment:"fixed" }}>
      <div style={{ position:"fixed", inset:0, background:"linear-gradient(to bottom,rgba(0,0,0,0.85),rgba(0,0,0,0.75) 50%,rgba(10,10,10,0.95))", pointerEvents:"none", zIndex:0 }}/>

      <div style={{ position:"relative", zIndex:10, maxWidth:"72rem", margin:"0 auto", padding:"7rem 1.5rem 5rem" }}>

        {/* Cabeçalho */}
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem", marginBottom:"2.5rem" }}>
          <div>
            <p style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.6rem", letterSpacing:"0.3em", textTransform:"uppercase", color:"#C9A96E", marginBottom:"0.5rem" }}>Marketplace</p>
            <h1 style={{ fontFamily:"Orbitron,sans-serif", fontSize:"2rem", fontWeight:700, color:"white", letterSpacing:"0.04em" }}>Vagas de Emprego</h1>
          </div>
          {podePublicar && (
            <button onClick={abrirModal}
              style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.625rem 1.25rem", borderRadius:"0.75rem", background:"linear-gradient(135deg,#C9A96E,#a07840)", color:"#0A0A0A", fontWeight:600, fontSize:"0.875rem", border:"none", cursor:"pointer", boxShadow:"0 0 20px rgba(201,169,110,0.25)" }}>
              <IconPlus/> Nova Vaga
            </button>
          )}
        </div>

        {/* Busca */}
        <div style={{ position:"relative", maxWidth:"28rem", marginBottom:"2rem" }}>
          <input type="text" placeholder="Buscar por cargo, empresa ou descrição…" value={busca} onChange={e=>setBusca(e.target.value)}
            style={{ width:"100%", padding:"0.75rem 1rem", borderRadius:"0.75rem", fontSize:"0.875rem", color:"white", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", outline:"none" }}
            onFocus={e=>(e.target.style.borderColor="rgba(201,169,110,0.5)")} onBlur={e=>(e.target.style.borderColor="rgba(255,255,255,0.08)")}/>
        </div>

        {/* Contagem */}
        {!loading && <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.75rem", marginBottom:"1.5rem" }}>{vagasFiltradas.length} {vagasFiltradas.length===1?"vaga":"vagas"}</p>}

        {/* Lista */}
        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"1rem" }}>
            {[...Array(4)].map((_,i) => (
              <div key={i} style={{ borderRadius:"0.875rem", padding:"1.5rem", background:"#111", border:"1px solid rgba(255,255,255,0.05)", display:"flex", flexDirection:"column", gap:"0.75rem" }} className="animate-pulse">
                <div style={{ height:"1rem", background:"rgba(255,255,255,0.08)", borderRadius:"0.5rem", width:"60%" }}/>
                <div style={{ height:"0.75rem", background:"rgba(255,255,255,0.05)", borderRadius:"0.5rem", width:"35%" }}/>
                <div style={{ height:"3rem", background:"rgba(255,255,255,0.04)", borderRadius:"0.5rem" }}/>
              </div>
            ))}
          </div>
        ) : vagasFiltradas.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"6rem 0", textAlign:"center" }}>
            <div style={{ width:"3.5rem", height:"3.5rem", borderRadius:"50%", background:"rgba(201,169,110,0.07)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem" }}>
              <span style={{ color:"rgba(201,169,110,0.4)" }}><IconBriefcase/></span>
            </div>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.875rem" }}>Nenhuma vaga publicada.</p>
            {busca && <button onClick={()=>setBusca("")} style={{ marginTop:"0.75rem", color:"#C9A96E", fontSize:"0.75rem", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>Limpar busca</button>}
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"1rem" }}>
            {vagasFiltradas.map(vaga => (
              <VagaCard
                key={vaga.id}
                vaga={vaga}
                canDelete={canDelete(vaga)}
                onDelete={() => excluirVaga(vaga.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modal nova vaga ── */}
      {modalOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, padding:"1rem" }}>
          <div style={{ width:"100%", maxWidth:"32rem", background:"rgba(14,14,14,0.98)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"1rem", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.7)" }}>

            {/* Header modal */}
            <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <p style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.6rem", letterSpacing:"0.3em", textTransform:"uppercase", color:"#C9A96E", marginBottom:"0.25rem" }}>Marketplace</p>
                <h2 style={{ fontFamily:"Orbitron,sans-serif", fontSize:"1rem", fontWeight:700, color:"white", letterSpacing:"0.04em" }}>Publicar Vaga</h2>
              </div>
              <button onClick={()=>setModalOpen(false)}
                style={{ width:"2rem", height:"2rem", borderRadius:"0.5rem", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", cursor:"pointer", color:"rgba(255,255,255,0.4)" }}>
                <IconClose/>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={salvarVaga} style={{ padding:"1.5rem", display:"flex", flexDirection:"column", gap:"1rem" }}>

              {/* Empresa */}
              {isAdmin ? (
                <Field label="Empresa">
                  <select required value={form.empresa_id} onChange={e=>setForm(f=>({...f,empresa_id:e.target.value}))}
                    style={{ width:"100%", padding:"0.75rem 1rem", borderRadius:"0.75rem", fontSize:"0.875rem", color:"rgba(255,255,255,0.8)", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", outline:"none", cursor:"pointer", appearance:"none" }}
                    onFocus={e=>(e.target.style.borderColor="rgba(201,169,110,0.5)")} onBlur={e=>(e.target.style.borderColor="rgba(255,255,255,0.08)")}>
                    <option value="">Selecione a empresa</option>
                    {empresasList.map(emp=><option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                  </select>
                </Field>
              ) : (
                <Field label="Empresa">
                  <div style={{ padding:"0.75rem 1rem", borderRadius:"0.75rem", fontSize:"0.875rem", color:"rgba(255,255,255,0.4)", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                    {empresasMap[profile?.companyId] || "Minha empresa"}
                  </div>
                </Field>
              )}

              <Field label="Cargo">
                <StyledInput required placeholder="Ex: Operador de Corte" value={form.cargo} onChange={e=>setForm(f=>({...f,cargo:e.target.value}))}/>
              </Field>

              <Field label="Descrição">
                <textarea required placeholder="Descreva as responsabilidades e requisitos…" value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))} rows={4}
                  style={{ width:"100%", padding:"0.75rem 1rem", borderRadius:"0.75rem", fontSize:"0.875rem", color:"white", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", outline:"none", resize:"vertical", fontFamily:"inherit", boxSizing:"border-box" }}
                  onFocus={e=>(e.target.style.borderColor="rgba(201,169,110,0.5)")} onBlur={e=>(e.target.style.borderColor="rgba(255,255,255,0.08)")}/>
              </Field>

              <Field label="E-mail para contato">
                <StyledInput required type="email" placeholder="contato@empresa.com" value={form.contato_email} onChange={e=>setForm(f=>({...f,contato_email:e.target.value}))}/>
              </Field>

              {statusMsg && (
                <div style={{ borderRadius:"0.75rem", padding:"0.875rem", display:"flex", alignItems:"center", gap:"0.5rem", background:statusMsg.includes("Erro")?"rgba(248,113,113,0.08)":"rgba(74,222,128,0.08)", border:`1px solid ${statusMsg.includes("Erro")?"rgba(248,113,113,0.2)":"rgba(74,222,128,0.2)"}`, color:statusMsg.includes("Erro")?"#f87171":"#86efac", fontSize:"0.875rem" }}>
                  {statusMsg.includes("Erro")?<IconWarn/>:"✓"} {statusMsg}
                </div>
              )}

              <div style={{ display:"flex", gap:"0.75rem", paddingTop:"0.25rem" }}>
                <button type="button" onClick={()=>setModalOpen(false)}
                  style={{ flex:1, padding:"0.875rem", borderRadius:"0.75rem", fontSize:"0.875rem", color:"rgba(255,255,255,0.4)", background:"none", border:"1px solid rgba(255,255,255,0.08)", cursor:"pointer" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex:2, padding:"0.875rem", borderRadius:"0.75rem", fontSize:"0.875rem", fontWeight:600, background:saving?"rgba(201,169,110,0.15)":"linear-gradient(135deg,#C9A96E,#a07840)", color:saving?"#C9A96E":"#0A0A0A", border:"none", cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", opacity:saving?0.7:1 }}>
                  {saving?<><IconSpinner/>Publicando...</>:"Publicar Vaga"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card de vaga ──────────────────────────────────────────────
function VagaCard({ vaga, canDelete, onDelete }) {
  const [confirm, setConfirm] = useState(false);
  const [deleting,setDeleting]= useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  };

  return (
    <div style={{ borderRadius:"0.875rem", overflow:"hidden", background:"#111111", border:"1px solid rgba(255,255,255,0.06)", transition:"border-color 0.3s, box-shadow 0.3s", position:"relative" }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(201,169,110,0.2)";e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,0.4)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.06)";e.currentTarget.style.boxShadow="none";}}>

      {/* Faixa top */}
      <div style={{ height:"3px", background:"linear-gradient(90deg,rgba(201,169,110,0.4),transparent)" }}/>

      <div style={{ padding:"1.25rem" }}>
        {/* Botão excluir */}
        {canDelete && !confirm && (
          <button onClick={()=>setConfirm(true)}
            style={{ position:"absolute", top:"1rem", right:"1rem", width:"1.75rem", height:"1.75rem", borderRadius:"0.5rem", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.15)", cursor:"pointer", color:"rgba(248,113,113,0.6)" }}
            onMouseEnter={e=>(e.currentTarget.style.color="#f87171")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(248,113,113,0.6)")}>
            <IconTrash/>
          </button>
        )}

        {/* Cargo */}
        <h3 style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.82rem", fontWeight:700, letterSpacing:"0.03em", color:"white", marginBottom:"0.375rem", paddingRight:"2.5rem" }}>
          {vaga.cargo}
        </h3>

        {/* Empresa */}
        <div style={{ display:"flex", alignItems:"center", gap:"0.375rem", color:"#C9A96E", fontSize:"0.75rem", marginBottom:"0.875rem" }}>
          <IconPin/>{vaga.empresas?.nome || "—"}
        </div>

        {/* Descrição */}
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.8rem", lineHeight:1.6, marginBottom:"1rem" }}>
          {vaga.descricao}
        </p>

        {/* Contato */}
        <a href={`mailto:${vaga.contato_email}`}
          style={{ display:"inline-flex", alignItems:"center", gap:"0.375rem", fontSize:"0.78rem", color:"#C9A96E", textDecoration:"none", padding:"0.375rem 0.75rem", borderRadius:"0.5rem", background:"rgba(201,169,110,0.08)", border:"1px solid rgba(201,169,110,0.15)" }}>
          <IconMail/>{vaga.contato_email}
        </a>

        {/* Confirmação de exclusão */}
        {confirm && (
          <div style={{ marginTop:"1rem", padding:"0.875rem", borderRadius:"0.75rem", background:"rgba(248,113,113,0.07)", border:"1px solid rgba(248,113,113,0.2)" }}>
            <p style={{ color:"#f87171", fontSize:"0.78rem", marginBottom:"0.625rem" }}>Excluir esta vaga?</p>
            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button onClick={()=>setConfirm(false)} style={{ flex:1, padding:"0.5rem", borderRadius:"0.5rem", fontSize:"0.75rem", color:"rgba(255,255,255,0.4)", background:"none", border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer" }}>Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex:1, padding:"0.5rem", borderRadius:"0.5rem", fontSize:"0.75rem", color:"white", background:"#dc2626", border:"none", cursor:"pointer", opacity:deleting?0.6:1 }}>
                {deleting?"Excluindo…":"Confirmar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Auxiliares ────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem" }}>
      <label style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.6rem", letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)" }}>{label}</label>
      {children}
    </div>
  );
}

function StyledInput({ ...props }) {
  return (
    <input {...props}
      style={{ width:"100%", padding:"0.75rem 1rem", borderRadius:"0.75rem", fontSize:"0.875rem", color:"white", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", outline:"none", boxSizing:"border-box" }}
      onFocus={e=>(e.target.style.borderColor="rgba(201,169,110,0.5)")} onBlur={e=>(e.target.style.borderColor="rgba(255,255,255,0.08)")}/>
  );
}
