// src/components/CadastroRocha.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "./context/AuthContext";
import fundoImage from "../img/fundo.png";

// ── Constantes ────────────────────────────────────────────────
const TIPOS       = ["Granito","Mármore","Quartzito","Travertino","Basalto","Ardósia","Outro"];
const ACABAMENTOS = ["Polido","Escovado","Flameado","Apicoado","Bruto","Jateado","Outro"];

// ── Ícones ────────────────────────────────────────────────────
const IconUpload  = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>);
const IconBack    = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>);
const IconCheck   = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconWarn    = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IconSpinner = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>);
const IconClose   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>);

// ── Sub-componentes de UI ─────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem" }}>
      <label style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.6rem", letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)" }}>{label}</label>
      {children}
      {hint && <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.72rem" }}>{hint}</p>}
    </div>
  );
}

const inputStyle = { width:"100%", padding:"0.75rem 1rem", borderRadius:"0.75rem", fontSize:"0.875rem", color:"white", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", outline:"none", boxSizing:"border-box" };
const focusGold  = e => (e.target.style.borderColor = "rgba(201,169,110,0.5)");
const blurGray   = e => (e.target.style.borderColor = "rgba(255,255,255,0.08)");

function StyledInput(props)  { return <input  style={inputStyle} onFocus={focusGold} onBlur={blurGray} {...props}/>; }
function StyledSelect({ children, ...props }) {
  return (
    <select style={{ ...inputStyle, cursor:"pointer", appearance:"none" }} onFocus={focusGold} onBlur={blurGray} {...props}>
      {children}
    </select>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function CadastroRocha() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const isAdmin   = profile?.role === "admin";
  const isEmpresa = profile?.role === "empresa";

  const [empresas,    setEmpresas]    = useState([]);
  const [empresaId,   setEmpresaId]   = useState("");
  const [empresaNome, setEmpresaNome] = useState("");

  const [nome,           setNome]           = useState("");
  const [tipo,           setTipo]           = useState("");
  const [acabamento,     setAcabamento]     = useState("");
  const [entradaInicial, setEntradaInicial] = useState("");

  const [imagem,     setImagem]     = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [status,         setStatus]         = useState("");
  const [statusType,     setStatusType]     = useState("");
  const [salvando,       setSalvando]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Duplicata
  const [rochasExistentes,   setRochasExistentes]   = useState([]);
  const [usarRochaExistente, setUsarRochaExistente] = useState("");
  const [checandoDuplicata,  setChecandoDuplicata]  = useState(false);
  const [existeDuplicata,    setExisteDuplicata]    = useState(false);
  const debounceTimer = useRef(null);

  // empresaId efetivo
  const finalEmpresaId = useMemo(
    () => isEmpresa ? profile?.companyId : empresaId,
    [isEmpresa, profile?.companyId, empresaId]
  );

  // ── Carrega empresas ──────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const load = async () => {
      if (isAdmin) {
        const { data } = await supabase.from("empresas").select("id, nome").order("nome");
        setEmpresas(data || []);
      } else if (isEmpresa && profile?.companyId) {
        const { data } = await supabase.from("empresas").select("id, nome").eq("id", profile.companyId).single();
        if (data) { setEmpresaId(data.id); setEmpresaNome(data.nome); }
        else { setStatus("Empresa vinculada não encontrada."); setStatusType("error"); }
      }
    };
    load();
  }, [loading, isAdmin, isEmpresa, profile]);

  // ── Debounce verificação de duplicata ─────────────────────
  useEffect(() => {
    setRochasExistentes([]); setUsarRochaExistente(""); setExisteDuplicata(false);
    if (!finalEmpresaId) return;
    const nomeT = nome.trim();
    if (nomeT.length < 2) { clearTimeout(debounceTimer.current); return; }
    setChecandoDuplicata(true);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from("rochas")
        .select("id, nome, estoque_m2")
        .eq("empresa_id", finalEmpresaId)
        .ilike("nome", nomeT);  // ilike = case-insensitive
      if (data && data.length > 0) { setRochasExistentes(data); setExisteDuplicata(true); }
      setChecandoDuplicata(false);
    }, 350);
    return () => clearTimeout(debounceTimer.current);
  }, [nome, finalEmpresaId]);

  // ── Preview imagem ────────────────────────────────────────
  const handleImagemChange = (e) => {
    const file = e.target.files[0];
    setImagem(file || null);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };
  const removerImagem = () => {
    setImagem(null); setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Reset ─────────────────────────────────────────────────
  const resetForm = () => {
    if (isAdmin) setEmpresaId("");
    setNome(""); setTipo(""); setAcabamento(""); setEntradaInicial("");
    setImagem(null); setPreviewUrl(null);
    setRochasExistentes([]); setExisteDuplicata(false); setUsarRochaExistente("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(""); setStatusType(""); setSalvando(true); setUploadProgress(0);
    try {
      if (!finalEmpresaId) { setStatus("Selecione a empresa."); setStatusType("error"); return; }
      const nomeT     = nome.trim();
      const estoqueM2 = Number(entradaInicial || 0);

      // ── FLUXO A: adicionar estoque em rocha existente ─────
      if (usarRochaExistente) {
        setUploadProgress(50);
        if (estoqueM2 > 0) {
          const { error } = await supabase.rpc("movimentar_estoque", {
            p_rocha_id: usarRochaExistente,
            p_tipo:     "entrada",
            p_m2:       estoqueM2,
            p_obs:      "Entrada adicional pelo cadastro",
          });
          if (error) throw error;
        }
        setUploadProgress(100);
        setStatus("Estoque atualizado na rocha existente!"); setStatusType("success");
        resetForm(); return;
      }

      // ── FLUXO B: criar nova rocha ─────────────────────────

      // Upload de foto para o bucket "rochas"
      let foto_url = "";
      if (imagem) {
        setUploadProgress(20);
        const ext      = imagem.name.split(".").pop();
        const filePath = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("rochas").upload(filePath, imagem);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("rochas").getPublicUrl(filePath);
        foto_url = urlData.publicUrl;
        setUploadProgress(60);
      }

      // Insere rocha
      const { data: novaRocha, error: insertErr } = await supabase
        .from("rochas")
        .insert({
          nome:        nomeT,
          tipo:        tipo.trim(),
          acabamento:  acabamento.trim(),
          empresa_id:  finalEmpresaId,
          estoque_m2:  estoqueM2,
          foto_url,
          criado_por:  user?.id || null,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      setUploadProgress(80);

      // Registra movimentação inicial
      if (estoqueM2 > 0 && user?.id) {
        await supabase.from("movimentacoes").insert({
          rocha_id:  novaRocha.id,
          tipo:      "entrada",
          m2:        estoqueM2,
          obs:       "Entrada inicial",
          user_id:   user.id,
          criado_em: new Date().toISOString(),
        });
      }

      setUploadProgress(100);
      setStatus("Rocha cadastrada com sucesso!"); setStatusType("success");
      resetForm();
    } catch (err) {
      console.error("Erro ao salvar rocha:", err);
      setStatus(err.message || "Erro inesperado ao salvar rocha."); setStatusType("error");
    } finally {
      setSalvando(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0A0A0A", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ color:"rgba(255,255,255,0.3)", display:"flex", gap:"0.5rem", alignItems:"center" }}><IconSpinner/> Carregando...</span>
    </div>
  );
  if (isEmpresa && !profile?.companyId) return (
    <div style={{ minHeight:"100vh", background:"#0A0A0A", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ color:"#f87171", fontSize:"0.875rem" }}>Seu usuário não está vinculado a uma empresa.</p>
    </div>
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", position:"relative", backgroundImage:`url(${fundoImage})`, backgroundSize:"cover", backgroundPosition:"center", backgroundAttachment:"fixed" }}>
      <div style={{ position:"fixed", inset:0, background:"linear-gradient(to bottom,rgba(0,0,0,0.85),rgba(0,0,0,0.75) 50%,rgba(10,10,10,0.95))", pointerEvents:"none", zIndex:0 }}/>

      <div style={{ position:"relative", zIndex:10, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"7rem 1rem 5rem" }}>
        <div style={{ width:"100%", maxWidth:"36rem", background:"rgba(14,14,14,0.96)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"1rem", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.6)" }}>

          {/* Header */}
          <div style={{ padding:"1.5rem 2rem", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <p style={{ fontFamily:"Orbitron,sans-serif", fontSize:"0.6rem", letterSpacing:"0.3em", textTransform:"uppercase", color:"#C9A96E", marginBottom:"0.25rem" }}>Marketplace</p>
              <h1 style={{ fontFamily:"Orbitron,sans-serif", fontWeight:700, fontSize:"1.25rem", color:"white", letterSpacing:"0.04em" }}>
                {usarRochaExistente ? "Adicionar Estoque" : "Cadastrar Rocha"}
              </h1>
            </div>
            <button onClick={() => navigate("/lista")} style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.75rem", color:"rgba(255,255,255,0.3)", background:"none", border:"none", cursor:"pointer" }}
              onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.7)")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.3)")}>
              <IconBack/> Voltar
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding:"2rem", display:"flex", flexDirection:"column", gap:"1.5rem" }}>

            {/* Empresa */}
            <Field label="Empresa">
              {isAdmin ? (
                <StyledSelect value={empresaId} onChange={e=>setEmpresaId(e.target.value)} required>
                  <option value="">Selecione a empresa</option>
                  {empresas.map(emp=><option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                </StyledSelect>
              ) : (
                <div style={{ padding:"0.75rem 1rem", borderRadius:"0.75rem", color:"rgba(255,255,255,0.4)", fontSize:"0.875rem", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  {empresaNome || "Carregando..."}
                </div>
              )}
            </Field>

            {/* Nome */}
            <Field label="Nome da Rocha">
              <div style={{ position:"relative" }}>
                <StyledInput type="text" placeholder="Ex: Granito Verde Ubatuba" value={nome} onChange={e=>setNome(e.target.value)} required style={{ ...inputStyle, paddingRight: nome.length>=2&&finalEmpresaId?"2.5rem":"1rem" }}/>
                {nome.length>=2 && finalEmpresaId && (
                  <span style={{ position:"absolute", right:"0.75rem", top:"50%", transform:"translateY(-50%)", color:checandoDuplicata?"rgba(255,255,255,0.3)":existeDuplicata?"#fbbf24":"#4ade80" }}>
                    {checandoDuplicata?<IconSpinner/>:existeDuplicata?<IconWarn/>:<IconCheck/>}
                  </span>
                )}
              </div>

              {existeDuplicata && !checandoDuplicata && (
                <div style={{ marginTop:"0.5rem", borderRadius:"0.75rem", padding:"1rem", background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.2)" }}>
                  <p style={{ color:"#fbbf24", fontSize:"0.8rem", display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.625rem" }}>
                    <IconWarn/> Já existe uma rocha com esse nome nesta empresa.
                  </p>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.75rem", marginBottom:"0.625rem" }}>Selecione abaixo para adicionar estoque, ou use outro nome:</p>
                  <StyledSelect value={usarRochaExistente} onChange={e=>setUsarRochaExistente(e.target.value)}>
                    <option value="">— Criar nova (bloqueado) —</option>
                    {rochasExistentes.map(r=>(
                      <option key={r.id} value={r.id}>Usar: {r.nome} · estoque: {r.estoque_m2 ?? 0} m²</option>
                    ))}
                  </StyledSelect>
                </div>
              )}
            </Field>

            {/* Tipo + Acabamento (só nova rocha) */}
            {!usarRochaExistente && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                <Field label="Tipo">
                  <StyledSelect value={tipo} onChange={e=>setTipo(e.target.value)} required>
                    <option value="">Selecionar</option>
                    {TIPOS.map(t=><option key={t} value={t}>{t}</option>)}
                  </StyledSelect>
                </Field>
                <Field label="Acabamento">
                  <StyledSelect value={acabamento} onChange={e=>setAcabamento(e.target.value)} required>
                    <option value="">Selecionar</option>
                    {ACABAMENTOS.map(a=><option key={a} value={a}>{a}</option>)}
                  </StyledSelect>
                </Field>
              </div>
            )}

            {/* m² */}
            <Field label={usarRochaExistente?"m² a adicionar":"Estoque inicial (m²)"}>
              <StyledInput type="number" min="0" step="0.01" placeholder="0.00" value={entradaInicial} onChange={e=>setEntradaInicial(e.target.value)} required/>
            </Field>

            {/* Upload (só nova rocha) */}
            {!usarRochaExistente && (
              <Field label="Foto da Rocha" hint="Opcional · JPG, PNG, WEBP">
                {!previewUrl ? (
                  <div onClick={()=>fileInputRef.current?.click()}
                    style={{ borderRadius:"0.75rem", border:"1.5px dashed rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.02)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"0.75rem", padding:"2.5rem 1rem", cursor:"pointer" }}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor="rgba(201,169,110,0.4)")} onMouseLeave={e=>(e.currentTarget.style.borderColor="rgba(255,255,255,0.1)")}>
                    <span style={{ color:"rgba(255,255,255,0.2)" }}><IconUpload/></span>
                    <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.8rem" }}>Clique para selecionar uma imagem</p>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagemChange} style={{ display:"none" }}/>
                  </div>
                ) : (
                  <div style={{ position:"relative", borderRadius:"0.75rem", overflow:"hidden", border:"1px solid rgba(201,169,110,0.2)" }}>
                    <img src={previewUrl} alt="Preview" style={{ width:"100%", height:"12rem", objectFit:"cover" }}/>
                    <button type="button" onClick={removerImagem}
                      style={{ position:"absolute", top:"0.75rem", right:"0.75rem", width:"2rem", height:"2rem", borderRadius:"0.5rem", background:"rgba(0,0,0,0.7)", border:"1px solid rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(255,255,255,0.7)" }}>
                      <IconClose/>
                    </button>
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"0.375rem 0.75rem", background:"rgba(0,0,0,0.6)", fontSize:"0.72rem", color:"rgba(255,255,255,0.5)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {imagem?.name}
                    </div>
                  </div>
                )}
              </Field>
            )}

            {/* Barra de progresso */}
            {salvando && uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.72rem", color:"rgba(255,255,255,0.3)", marginBottom:"0.25rem" }}>
                  <span>Enviando...</span><span>{uploadProgress}%</span>
                </div>
                <div style={{ height:"3px", borderRadius:"9999px", background:"rgba(255,255,255,0.08)", overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:"9999px", width:`${uploadProgress}%`, background:"linear-gradient(90deg,#C9A96E,#a07840)", transition:"width 0.3s" }}/>
                </div>
              </div>
            )}

            {/* Botão */}
            <button type="submit" disabled={salvando||checandoDuplicata||(existeDuplicata&&!usarRochaExistente)}
              style={{ padding:"0.875rem", borderRadius:"0.75rem", fontWeight:600, fontSize:"0.875rem", letterSpacing:"0.1em", textTransform:"uppercase", background:salvando||(existeDuplicata&&!usarRochaExistente)?"rgba(201,169,110,0.15)":"linear-gradient(135deg,#C9A96E,#a07840)", color:salvando||(existeDuplicata&&!usarRochaExistente)?"#C9A96E":"#0A0A0A", border:"none", cursor:(salvando||checandoDuplicata||(existeDuplicata&&!usarRochaExistente))?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", opacity:(salvando||checandoDuplicata)&&!(existeDuplicata&&!usarRochaExistente)?0.7:1, boxShadow:salvando?"none":"0 0 24px rgba(201,169,110,0.2)" }}>
              {salvando ? <><IconSpinner/>{usarRochaExistente?"Atualizando...":"Cadastrando..."}</>
                : existeDuplicata&&!usarRochaExistente ? "Selecione a rocha existente"
                : usarRochaExistente ? "Adicionar ao estoque"
                : "Cadastrar Rocha"}
            </button>

            {/* Status */}
            {status && (
              <div style={{ borderRadius:"0.75rem", padding:"1rem", display:"flex", flexDirection:"column", alignItems:"center", gap:"0.25rem", background:statusType==="success"?"rgba(74,222,128,0.08)":"rgba(248,113,113,0.08)", border:`1px solid ${statusType==="success"?"rgba(74,222,128,0.2)":"rgba(248,113,113,0.2)"}`, color:statusType==="success"?"#86efac":"#f87171", fontSize:"0.875rem" }}>
                <span style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                  {statusType==="success"?<IconCheck/>:<IconWarn/>} {status}
                </span>
                {statusType==="success" && (
                  <button type="button" onClick={()=>navigate("/lista")}
                    style={{ fontSize:"0.75rem", textDecoration:"underline", opacity:0.6, background:"none", border:"none", color:"inherit", cursor:"pointer", marginTop:"0.25rem" }}>
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
