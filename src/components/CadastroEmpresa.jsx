// src/components/CadastroEmpresa.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import fundoImage from "../img/fundo.png";

const IconBack    = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>);
const IconBuilding= () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><rect x="9" y="13" width="6" height="8" rx="0.5"/></svg>);
const IconLock    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>);
const IconMail    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const IconPin     = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>);
const IconEye     = ({ off }) => off ? (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>);
const IconCheck   = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconWarn    = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IconSpinner = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>);

function Field({ label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem" }}>
      <label style={{ fontFamily:"Orbitron, sans-serif", fontSize:"0.6rem", letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)" }}>{label}</label>
      {children}
    </div>
  );
}

function IconInput({ icon, rightSlot, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.75rem 1rem", borderRadius:"0.75rem", background:"rgba(255,255,255,0.04)", border:`1px solid ${focused?"rgba(201,169,110,0.5)":"rgba(255,255,255,0.08)"}`, transition:"border-color 0.2s" }}>
      <span style={{ color: focused?"#C9A96E":"rgba(255,255,255,0.2)", flexShrink:0 }}>{icon}</span>
      <input {...props} onFocus={e=>{setFocused(true);props.onFocus?.(e);}} onBlur={e=>{setFocused(false);props.onBlur?.(e);}} style={{ background:"transparent", border:"none", outline:"none", color:"white", width:"100%", fontSize:"0.875rem" }} />
      {rightSlot && <span style={{ flexShrink:0 }}>{rightSlot}</span>}
    </div>
  );
}

function SectionDivider({ step, label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
      <div style={{ width:"1.5rem", height:"1.5rem", borderRadius:"50%", background:"rgba(201,169,110,0.15)", border:"1px solid rgba(201,169,110,0.25)", color:"#C9A96E", fontSize:"0.7rem", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{step}</div>
      <p style={{ fontFamily:"Orbitron, sans-serif", fontSize:"0.6rem", letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", flex:1 }}>{label}</p>
      <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,0.05)" }} />
    </div>
  );
}

function PasswordStrength({ senha }) {
  if (!senha) return null;
  const score = [senha.length>=8,/[A-Z]/.test(senha),/[0-9]/.test(senha),/[^A-Za-z0-9]/.test(senha)].filter(Boolean).length;
  const colors = ["","#f87171","#fb923c","#facc15","#4ade80"];
  const labels = ["","Fraca","Regular","Boa","Forte"];
  return (
    <div style={{ marginTop:"0.5rem" }}>
      <div style={{ display:"flex", gap:"0.25rem", marginBottom:"0.25rem" }}>
        {[1,2,3,4].map(i=><div key={i} style={{ flex:1, height:"2px", borderRadius:"9999px", background:i<=score?colors[score]:"rgba(255,255,255,0.08)", transition:"background 0.3s" }}/>)}
      </div>
      <p style={{ fontSize:"0.72rem", color:colors[score]||"transparent" }}>Senha {labels[score]}</p>
    </div>
  );
}

export default function CadastroEmpresa() {
  const navigate = useNavigate();
  const [nome,setNome]=useState(""); const [endereco,setEndereco]=useState(""); const [telefone,setTelefone]=useState(""); const [cnpj,setCnpj]=useState("");
  const [email,setEmail]=useState(""); const [senha,setSenha]=useState(""); const [confirmarSenha,setConfirmarSenha]=useState(""); const [mostrarSenha,setMostrarSenha]=useState(false);
  const [salvando,setSalvando]=useState(false); const [status,setStatus]=useState(""); const [statusType,setStatusType]=useState(""); const [sucesso,setSucesso]=useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setStatus(""); setStatusType("");
    if (senha !== confirmarSenha) { setStatus("As senhas não coincidem."); setStatusType("error"); return; }
    if (senha.length < 6) { setStatus("Mínimo 6 caracteres."); setStatusType("error"); return; }
    setSalvando(true);
    try {
      const { data: emp, error: empErr } = await supabase.from("empresas").insert({ nome, endereco, telefone: telefone||null, cnpj: cnpj||null }).select().single();
      if (empErr) throw empErr;
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password: senha });
      if (authErr) throw authErr;
      const { error: profErr } = await supabase.from("usuarios").insert({ id: authData.user.id, role: "empresa", empresa_id: emp.id });
      if (profErr) throw profErr;
      setSucesso(true);
      setNome(""); setEndereco(""); setTelefone(""); setCnpj(""); setEmail(""); setSenha(""); setConfirmarSenha("");
    } catch (err) {
      let msg = "Erro ao cadastrar empresa.";
      if (err.message?.includes("already registered")) msg = "Este e-mail já está em uso.";
      setStatus(msg); setStatusType("error");
    } finally { setSalvando(false); }
  };

  const pageStyle = { minHeight:"100vh", position:"relative", backgroundImage:`url(${fundoImage})`, backgroundSize:"cover", backgroundPosition:"center", backgroundAttachment:"fixed" };
  const overlayStyle = { position:"fixed", inset:0, background:"linear-gradient(to bottom,rgba(0,0,0,0.85),rgba(0,0,0,0.75) 50%,rgba(10,10,10,0.95))", pointerEvents:"none", zIndex:0 };

  if (sucesso) return (
    <div style={{ ...pageStyle, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
      <div style={overlayStyle}/>
      <div style={{ position:"relative", zIndex:10, width:"100%", maxWidth:"28rem", background:"rgba(14,14,14,0.96)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"1rem", padding:"2.5rem", textAlign:"center" }}>
        <div style={{ width:"4rem", height:"4rem", borderRadius:"50%", background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.25)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1.5rem", color:"#4ade80" }}><IconCheck/></div>
        <h2 style={{ fontFamily:"Orbitron, sans-serif", fontSize:"1.25rem", fontWeight:700, color:"white", marginBottom:"0.5rem" }}>Empresa cadastrada!</h2>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.875rem", marginBottom:"2rem" }}>Empresa e usuário criados com sucesso.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          <button onClick={()=>setSucesso(false)} style={{ padding:"0.875rem", borderRadius:"0.75rem", background:"linear-gradient(135deg,#C9A96E,#a07840)", color:"#0A0A0A", fontWeight:600, fontSize:"0.875rem", border:"none", cursor:"pointer" }}>Cadastrar outra empresa</button>
          <button onClick={()=>navigate("/")} style={{ padding:"0.875rem", borderRadius:"0.75rem", background:"transparent", color:"rgba(255,255,255,0.35)", border:"1px solid rgba(255,255,255,0.07)", cursor:"pointer", fontSize:"0.875rem" }}>Voltar ao início</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      <div style={overlayStyle}/>
      <div style={{ position:"relative", zIndex:10, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"7rem 1rem 5rem" }}>
        <div style={{ width:"100%", maxWidth:"36rem", background:"rgba(14,14,14,0.96)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"1rem", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.6)" }}>
          <div style={{ padding:"1.5rem 2rem", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <p style={{ fontFamily:"Orbitron, sans-serif", fontSize:"0.6rem", letterSpacing:"0.3em", textTransform:"uppercase", color:"#C9A96E", marginBottom:"0.25rem" }}>Admin</p>
              <h1 style={{ fontFamily:"Orbitron, sans-serif", fontWeight:700, fontSize:"1.25rem", color:"white", letterSpacing:"0.04em" }}>Cadastrar Empresa</h1>
            </div>
            <button onClick={()=>navigate("/")} style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.75rem", color:"rgba(255,255,255,0.3)", background:"none", border:"none", cursor:"pointer" }}>
              <IconBack/> Voltar
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ padding:"2rem", display:"flex", flexDirection:"column", gap:"1.25rem" }}>
            <SectionDivider step="1" label="Dados da Empresa"/>
            <Field label="Nome da empresa"><IconInput icon={<IconBuilding/>} type="text" placeholder="Ex: Mármores Vitória Ltda" value={nome} onChange={e=>setNome(e.target.value)} required/></Field>
            <Field label="Endereço completo"><IconInput icon={<IconPin/>} type="text" placeholder="Rua, número, cidade, estado" value={endereco} onChange={e=>setEndereco(e.target.value)} required/></Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
              <Field label="Telefone"><IconInput icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>} type="tel" placeholder="(00) 00000-0000" value={telefone} onChange={e=>setTelefone(e.target.value)}/></Field>
              <Field label="CNPJ"><IconInput icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>} type="text" placeholder="00.000.000/0000-00" value={cnpj} onChange={e=>setCnpj(e.target.value)}/></Field>
            </div>
            <SectionDivider step="2" label="Credenciais de Acesso"/>
            <Field label="E-mail"><IconInput icon={<IconMail/>} type="email" placeholder="empresa@email.com" value={email} onChange={e=>setEmail(e.target.value)} required/></Field>
            <Field label="Senha">
              <IconInput icon={<IconLock/>} type={mostrarSenha?"text":"password"} placeholder="Mínimo 6 caracteres" value={senha} onChange={e=>setSenha(e.target.value)} required minLength={6} rightSlot={<button type="button" onClick={()=>setMostrarSenha(v=>!v)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.25)" }}><IconEye off={mostrarSenha}/></button>}/>
              <PasswordStrength senha={senha}/>
            </Field>
            <Field label="Confirmar senha">
              <IconInput icon={<IconLock/>} type={mostrarSenha?"text":"password"} placeholder="Repita a senha" value={confirmarSenha} onChange={e=>setConfirmarSenha(e.target.value)} required minLength={6} rightSlot={confirmarSenha && <span style={{ color:confirmarSenha===senha?"#4ade80":"#f87171" }}>{confirmarSenha===senha?<IconCheck/>:<IconWarn/>}</span>}/>
            </Field>
            {status && statusType==="error" && <div style={{ borderRadius:"0.75rem", padding:"1rem", display:"flex", alignItems:"center", gap:"0.75rem", background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", color:"#f87171", fontSize:"0.875rem" }}><IconWarn/> {status}</div>}
            <button type="submit" disabled={salvando} style={{ padding:"0.875rem", borderRadius:"0.75rem", fontWeight:600, fontSize:"0.875rem", letterSpacing:"0.1em", textTransform:"uppercase", background:salvando?"rgba(201,169,110,0.15)":"linear-gradient(135deg,#C9A96E,#a07840)", color:salvando?"#C9A96E":"#0A0A0A", border:"none", cursor:salvando?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", opacity:salvando?0.6:1 }}>
              {salvando?<><IconSpinner/>Cadastrando...</>:"Cadastrar Empresa"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
