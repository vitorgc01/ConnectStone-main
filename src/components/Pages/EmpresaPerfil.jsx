// src/components/Pages/EmpresaPerfil.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import {
  doc, getDoc, collection, getDocs,
  query, where, orderBy,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import fundoImage from "../../img/fundo.png";

// ── Ícones ────────────────────────────────────────────────────
const IconBack    = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>);
const IconPin     = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>);
const IconPhone   = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>);
const IconMail    = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const IconBox     = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>);
const IconBriefcase = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>);
const IconClose   = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>);
const IconTrash   = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>);
const IconDoc     = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>);

// ── Badge tipo de rocha ───────────────────────────────────────
function TipoBadge({ tipo }) {
  const map = {
    granito:   { bg:"rgba(120,53,15,0.4)",   color:"#fcd34d", border:"rgba(180,83,9,0.4)" },
    mármore:   { bg:"rgba(30,41,59,0.6)",    color:"#cbd5e1", border:"rgba(71,85,105,0.4)" },
    quartzito: { bg:"rgba(6,78,59,0.4)",     color:"#6ee7b7", border:"rgba(16,185,129,0.4)" },
    travertino:{ bg:"rgba(124,45,18,0.4)",   color:"#fed7aa", border:"rgba(194,65,12,0.4)" },
    basalto:   { bg:"rgba(39,39,42,0.6)",    color:"#d4d4d8", border:"rgba(82,82,91,0.4)" },
  };
  const s = map[(tipo || "").toLowerCase()] || { bg:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.5)", border:"rgba(255,255,255,0.1)" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"0.125rem 0.625rem", borderRadius:"9999px", fontSize:"0.7rem", background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      {tipo}
    </span>
  );
}

// ── Avatar com iniciais ───────────────────────────────────────
function EmpresaAvatar({ nome, size = 72 }) {
  const initials = (nome || "?").split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();
  return (
    <div style={{
      width:size, height:size, borderRadius:"1rem", flexShrink:0,
      background:"linear-gradient(135deg,rgba(201,169,110,0.2),rgba(160,120,64,0.1))",
      border:"1px solid rgba(201,169,110,0.25)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"Orbitron, sans-serif", fontWeight:700,
      fontSize:"1.4rem", color:"#C9A96E",
    }}>{initials}</div>
  );
}

// ── Section title ─────────────────────────────────────────────
function SectionTitle({ icon, label, count }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem" }}>
      <span style={{ color:"#C9A96E" }}>{icon}</span>
      <h2 style={{ fontFamily:"Orbitron, sans-serif", fontSize:"0.75rem", fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"white" }}>
        {label}
      </h2>
      {count != null && (
        <span style={{ padding:"0.125rem 0.625rem", borderRadius:"9999px", fontSize:"0.7rem", background:"rgba(201,169,110,0.1)", color:"#C9A96E", border:"1px solid rgba(201,169,110,0.2)" }}>
          {count}
        </span>
      )}
      <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,0.06)" }} />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function EmpresaPerfil() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const isAdmin   = profile?.role === "admin";
  const isEmpresa = profile?.role === "empresa";

  const [empresa, setEmpresa] = useState(null);
  const [rochas,  setRochas]  = useState([]);
  const [vagas,   setVagas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound,setNotFound]= useState(false);

  // Detalhe de rocha (drawer)
  const [rochaAberta,  setRochaAberta]  = useState(null);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [confirmDelete,setConfirmDelete]= useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Empresa
        const empSnap = await getDoc(doc(db, "empresas", id));
        if (!empSnap.exists()) { setNotFound(true); setLoading(false); return; }
        setEmpresa({ id: empSnap.id, ...empSnap.data() });

        // Rochas da empresa
        const rochasSnap = await getDocs(
          query(collection(db, "rochas"), where("empresaId", "==", id))
        );
        setRochas(rochasSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Vagas ativas da empresa
        const vagasSnap = await getDocs(
          query(
            collection(db, "vagas"),
            where("empresaId", "==", id),
            where("ativa", "==", true),
            orderBy("publicadaEm", "desc")
          )
        );
        setVagas(vagasSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const abrirRocha = (rocha) => {
    setRochaAberta(rocha); setDrawerOpen(true); setConfirmDelete(false);
  };
  const fecharRocha = () => {
    setDrawerOpen(false);
    setTimeout(() => setRochaAberta(null), 350);
  };

  const podeGerenciar = isAdmin || (isEmpresa && profile?.companyId === id);

  // ── Guards ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0A0A0A", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", color:"rgba(255,255,255,0.3)", fontSize:"0.875rem" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
        Carregando empresa...
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight:"100vh", background:"#0A0A0A", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"1rem" }}>
      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.875rem" }}>Empresa não encontrada.</p>
      <button onClick={() => navigate("/empresas")} style={{ color:"#C9A96E", fontSize:"0.75rem", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>
        ← Voltar às empresas
      </button>
    </div>
  );

  return (
    <div style={{
      minHeight:"100vh", position:"relative",
      backgroundImage:`url(${fundoImage})`,
      backgroundSize:"cover", backgroundPosition:"center", backgroundAttachment:"fixed",
    }}>
      {/* Overlay */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", background:"linear-gradient(to bottom,rgba(0,0,0,0.85),rgba(0,0,0,0.75) 50%,rgba(10,10,10,0.95))" }} />

      <div style={{ position:"relative", zIndex:10, maxWidth:"72rem", margin:"0 auto", padding:"7rem 1.5rem 5rem" }}>

        {/* ── Voltar ── */}
        <button onClick={() => navigate("/empresas")}
          style={{ display:"flex", alignItems:"center", gap:"0.5rem", color:"rgba(255,255,255,0.3)", background:"none", border:"none", cursor:"pointer", fontSize:"0.8rem", marginBottom:"2rem", transition:"color 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
          <IconBack /> Voltar às empresas
        </button>

        {/* ── Hero da empresa ── */}
        <div style={{
          borderRadius:"1.25rem", overflow:"hidden", marginBottom:"2.5rem",
          background:"rgba(14,14,14,0.96)", border:"1px solid rgba(255,255,255,0.07)",
          boxShadow:"0 24px 64px rgba(0,0,0,0.5)",
        }}>
          {/* Faixa dourada */}
          <div style={{ height:"4px", background:"linear-gradient(90deg,#C9A96E,#a07840,rgba(201,169,110,0.2))" }} />

          <div style={{ padding:"2rem" }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:"1.5rem", flexWrap:"wrap" }}>
              <EmpresaAvatar nome={empresa?.nome} size={72} />

              <div style={{ flex:1, minWidth:"200px" }}>
                <p style={{ fontFamily:"Orbitron, sans-serif", fontSize:"0.6rem", letterSpacing:"0.3em", textTransform:"uppercase", color:"#C9A96E", marginBottom:"0.375rem" }}>
                  Empresa
                </p>
                <h1 style={{ fontFamily:"Orbitron, sans-serif", fontSize:"1.6rem", fontWeight:700, color:"white", letterSpacing:"0.04em", marginBottom:"1rem" }}>
                  {empresa?.nome}
                </h1>

                {/* Dados de contato */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:"1.25rem" }}>
                  {empresa?.endereco && (
                    <InfoItem icon={<IconPin />} text={empresa.endereco} />
                  )}
                  {empresa?.telefone && (
                    <InfoItem icon={<IconPhone />} text={empresa.telefone} />
                  )}
                  {empresa?.cnpj && (
                    <InfoItem icon={<IconDoc />} text={`CNPJ: ${empresa.cnpj}`} />
                  )}
                </div>
              </div>

              {/* Pills de contagem */}
              <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
                <StatCard value={rochas.length} label="Rochas" icon={<IconBox />} />
                <StatCard value={vagas.length}  label="Vagas"  icon={<IconBriefcase />} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Rochas ── */}
        <section style={{ marginBottom:"3rem" }}>
          <SectionTitle icon={<IconBox />} label="Catálogo de Rochas" count={rochas.length} />

          {rochas.length === 0 ? (
            <EmptyState text="Nenhuma rocha cadastrada por esta empresa." />
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"1rem" }}>
              {rochas.map(rocha => (
                <RochaCard key={rocha.id} rocha={rocha} onClick={() => abrirRocha(rocha)} />
              ))}
            </div>
          )}
        </section>

        {/* ── Vagas ── */}
        <section style={{ marginBottom:"3rem" }}>
          <SectionTitle icon={<IconBriefcase />} label="Vagas de Emprego" count={vagas.length} />

          {vagas.length === 0 ? (
            <EmptyState text="Nenhuma vaga ativa no momento." />
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"1rem" }}>
              {vagas.map(vaga => (
                <VagaCard key={vaga.id} vaga={vaga} podeExcluir={podeGerenciar}
                  onExcluir={() => setVagas(prev => prev.filter(v => v.id !== vaga.id))} />
              ))}
            </div>
          )}
        </section>

        {/* ── Mapa ── */}
        {empresa?.endereco && (
          <section>
            <SectionTitle icon={<IconPin />} label="Localização" />
            <div style={{
              borderRadius:"1rem", overflow:"hidden",
              border:"1px solid rgba(255,255,255,0.07)",
              height:"360px",
            }}>
              <iframe
                title="mapa"
                width="100%" height="100%"
                style={{ border:0, filter:"grayscale(70%) brightness(0.65)" }}
                loading="lazy" allowFullScreen
                src={`https://www.google.com/maps?q=${encodeURIComponent(empresa.endereco)}&output=embed`}
              />
            </div>
            <p style={{ marginTop:"0.75rem", color:"rgba(255,255,255,0.3)", fontSize:"0.8rem", display:"flex", alignItems:"center", gap:"0.375rem" }}>
              <IconPin /> {empresa.endereco}
            </p>
          </section>
        )}
      </div>

      {/* ── Drawer detalhe da rocha ── */}
      {/* Backdrop */}
      <div onClick={fecharRocha} style={{
        position:"fixed", inset:0, zIndex:40, transition:"all 0.35s",
        background: drawerOpen ? "rgba(0,0,0,0.7)" : "transparent",
        backdropFilter: drawerOpen ? "blur(4px)" : "none",
        pointerEvents: drawerOpen ? "auto" : "none",
      }} />

      {/* Painel */}
      <div style={{
        position:"fixed", top:0, right:0, height:"100%", zIndex:50, overflowY:"auto",
        width:"min(520px,100vw)", background:"#0E0E0E",
        borderLeft:"1px solid rgba(255,255,255,0.07)",
        transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
        transition:"transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: drawerOpen ? "-20px 0 60px rgba(0,0,0,0.6)" : "none",
      }}>
        {rochaAberta && (
          <RochaDetalhe
            rocha={rochaAberta}
            onClose={fecharRocha}
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
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        borderRadius:"0.875rem", overflow:"hidden", cursor:"pointer",
        background:"#111111",
        border: hover ? "1px solid rgba(201,169,110,0.35)" : "1px solid rgba(255,255,255,0.06)",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hover ? "0 12px 40px rgba(0,0,0,0.5)" : "none",
        transition:"all 0.3s",
      }}>
      {/* Imagem */}
      <div style={{ height:"11rem", background:"rgba(255,255,255,0.04)", overflow:"hidden", position:"relative" }}>
        {rocha.fotoUrl ? (
          <img src={rocha.fotoUrl} alt={rocha.nome}
            style={{ width:"100%", height:"100%", objectFit:"cover", transform: hover ? "scale(1.05)" : "scale(1)", transition:"transform 0.5s" }} />
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:"3rem", color:"rgba(255,255,255,0.06)" }}>◈</span>
          </div>
        )}
        {rocha.tipo && (
          <div style={{ position:"absolute", top:"0.75rem", left:"0.75rem" }}>
            <TipoBadge tipo={rocha.tipo} />
          </div>
        )}
        <div style={{
          position:"absolute", top:"0.75rem", right:"0.75rem",
          padding:"0.125rem 0.5rem", borderRadius:"0.375rem", fontSize:"0.7rem",
          background:"rgba(0,0,0,0.65)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.7)",
        }}>
          {rocha.estoqueM2 ?? 0} m²
        </div>
      </div>

      <div style={{ padding:"1rem" }}>
        <h3 style={{
          fontFamily:"Orbitron, sans-serif", fontSize:"0.78rem", fontWeight:700,
          letterSpacing:"0.04em", color: hover ? "#C9A96E" : "white",
          transition:"color 0.3s", marginBottom:"0.25rem",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        }}>
          {rocha.nome}
        </h3>
        {rocha.acabamento && (
          <p style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.3)" }}>
            {rocha.acabamento}
          </p>
        )}
        <div style={{ marginTop:"0.875rem", display:"flex", alignItems:"center", gap:"0.25rem", fontSize:"0.65rem", letterSpacing:"0.1em", textTransform:"uppercase", color: hover ? "#C9A96E" : "rgba(255,255,255,0.2)", transition:"color 0.3s" }}>
          Ver detalhes
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round"/></svg>
        </div>
      </div>
    </div>
  );
}

// ── Detalhe da rocha no drawer ────────────────────────────────
function RochaDetalhe({ rocha, onClose }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Header */}
      <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:"#0E0E0E", zIndex:10 }}>
        <span style={{ fontFamily:"Orbitron, sans-serif", fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.2)" }}>
          Detalhe
        </span>
        <button onClick={onClose}
          style={{ width:"2rem", height:"2rem", borderRadius:"0.5rem", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", cursor:"pointer", color:"rgba(255,255,255,0.4)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "white")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
          <IconClose />
        </button>
      </div>

      {/* Imagem */}
      <div style={{ position:"relative", height:"280px", background:"#0A0A0A", flexShrink:0 }}>
        {rocha.fotoUrl ? (
          <img src={rocha.fotoUrl} alt={rocha.nome} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:"6rem", color:"rgba(255,255,255,0.04)" }}>◈</span>
          </div>
        )}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,#0E0E0E,transparent)" }} />
      </div>

      {/* Conteúdo */}
      <div style={{ padding:"1.5rem", flex:1 }}>
        {/* Nome */}
        <h2 style={{ fontFamily:"Orbitron, sans-serif", fontSize:"1.4rem", fontWeight:700, color:"white", letterSpacing:"0.04em", marginBottom:"0.75rem" }}>
          {rocha.nome}
        </h2>

        <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", marginBottom:"1.5rem" }}>
          {rocha.tipo      && <TipoBadge tipo={rocha.tipo} />}
          {rocha.acabamento && (
            <span style={{ padding:"0.125rem 0.625rem", borderRadius:"9999px", fontSize:"0.7rem", background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.5)", border:"1px solid rgba(255,255,255,0.1)" }}>
              {rocha.acabamento}
            </span>
          )}
        </div>

        <div style={{ height:"1px", background:"rgba(255,255,255,0.06)", marginBottom:"1.5rem" }} />

        {/* Grid de infos */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem", marginBottom:"1.5rem" }}>
          <InfoBox label="Tipo"      value={rocha.tipo       || "—"} />
          <InfoBox label="Estoque"   value={`${rocha.estoqueM2 ?? 0} m²`} highlight />
          <InfoBox label="Acabamento"value={rocha.acabamento  || "—"} />
          <InfoBox label="Cadastrado"value={rocha.criadoEm?.toDate
            ? rocha.criadoEm.toDate().toLocaleDateString("pt-BR")
            : "—"} />
        </div>
      </div>
    </div>
  );
}

// ── Card de vaga ──────────────────────────────────────────────
function VagaCard({ vaga, podeExcluir, onExcluir }) {
  const [confirm, setConfirm] = useState(false);

  const excluir = async () => {
    const { deleteDoc, doc } = await import("firebase/firestore");
    const { db } = await import("../../firebase");
    await deleteDoc(doc(db, "vagas", vaga.id));
    onExcluir();
  };

  return (
    <div style={{ borderRadius:"0.875rem", padding:"1.25rem", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", position:"relative" }}>
      {podeExcluir && !confirm && (
        <button onClick={() => setConfirm(true)}
          style={{ position:"absolute", top:"0.875rem", right:"0.875rem", width:"1.75rem", height:"1.75rem", borderRadius:"0.5rem", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.15)", cursor:"pointer", color:"rgba(248,113,113,0.6)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(248,113,113,0.6)")}>
          <IconTrash />
        </button>
      )}

      <h3 style={{ fontWeight:700, color:"rgba(255,255,255,0.9)", fontSize:"0.9rem", marginBottom:"0.25rem", paddingRight:"2rem" }}>
        {vaga.cargo}
      </h3>
      <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.8rem", marginBottom:"0.75rem" }}>
        {vaga.descricao}
      </p>
      <a href={`mailto:${vaga.contatoEmail}`}
        style={{ display:"flex", alignItems:"center", gap:"0.375rem", fontSize:"0.78rem", color:"#C9A96E", textDecoration:"none" }}>
        <IconMail /> {vaga.contatoEmail}
      </a>

      {confirm && (
        <div style={{ marginTop:"0.875rem", padding:"0.75rem", borderRadius:"0.75rem", background:"rgba(248,113,113,0.07)", border:"1px solid rgba(248,113,113,0.2)" }}>
          <p style={{ color:"#f87171", fontSize:"0.75rem", marginBottom:"0.5rem" }}>Excluir esta vaga?</p>
          <div style={{ display:"flex", gap:"0.5rem" }}>
            <button onClick={() => setConfirm(false)}
              style={{ flex:1, padding:"0.375rem", borderRadius:"0.5rem", fontSize:"0.75rem", color:"rgba(255,255,255,0.4)", background:"none", border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer" }}>
              Cancelar
            </button>
            <button onClick={excluir}
              style={{ flex:1, padding:"0.375rem", borderRadius:"0.5rem", fontSize:"0.75rem", color:"white", background:"#dc2626", border:"none", cursor:"pointer" }}>
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Auxiliares ────────────────────────────────────────────────
function InfoItem({ icon, text }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.375rem", color:"rgba(255,255,255,0.4)", fontSize:"0.8rem" }}>
      <span style={{ color:"#C9A96E", flexShrink:0 }}>{icon}</span>
      {text}
    </div>
  );
}

function StatCard({ value, label, icon }) {
  return (
    <div style={{ borderRadius:"0.875rem", padding:"0.875rem 1.25rem", textAlign:"center", background:"rgba(201,169,110,0.07)", border:"1px solid rgba(201,169,110,0.15)", minWidth:"80px" }}>
      <div style={{ color:"#C9A96E", display:"flex", justifyContent:"center", marginBottom:"0.25rem" }}>{icon}</div>
      <p style={{ fontSize:"1.5rem", fontWeight:700, color:"#C9A96E", lineHeight:1 }}>{value}</p>
      <p style={{ fontSize:"0.65rem", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.1em", marginTop:"0.25rem" }}>{label}</p>
    </div>
  );
}

function InfoBox({ label, value, highlight }) {
  return (
    <div style={{ borderRadius:"0.75rem", padding:"0.875rem", background: highlight ? "rgba(201,169,110,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${highlight ? "rgba(201,169,110,0.15)" : "rgba(255,255,255,0.06)"}` }}>
      <p style={{ fontFamily:"Orbitron, sans-serif", fontSize:"0.55rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"0.25rem" }}>
        {label}
      </p>
      <p style={{ fontSize:"0.875rem", fontWeight:600, color: highlight ? "#C9A96E" : "rgba(255,255,255,0.85)" }}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ padding:"2.5rem", textAlign:"center", borderRadius:"1rem", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
      <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.875rem" }}>{text}</p>
    </div>
  );
}
