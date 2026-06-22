// src/components/Pages/Empresas.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import fundoImage from "../../img/fundo.png";

// ── Ícones ────────────────────────────────────────────────────
const IconSearch  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>);
const IconPin     = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>);
const IconPhone   = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>);
const IconBox     = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>);
const IconArrow   = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>);
const IconBriefcase = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>);

// ── Skeleton ──────────────────────────────────────────────────
const SkeletonCard = () => (
  <div style={{ borderRadius:"1rem", border:"1px solid rgba(255,255,255,0.05)", background:"#111", overflow:"hidden" }}
    className="animate-pulse">
    <div style={{ height:"140px", background:"rgba(255,255,255,0.04)" }} />
    <div style={{ padding:"1.5rem", display:"flex", flexDirection:"column", gap:"0.75rem" }}>
      <div style={{ height:"1rem", background:"rgba(255,255,255,0.08)", borderRadius:"0.5rem", width:"60%" }} />
      <div style={{ height:"0.75rem", background:"rgba(255,255,255,0.05)", borderRadius:"0.5rem", width:"80%" }} />
      <div style={{ height:"0.75rem", background:"rgba(255,255,255,0.05)", borderRadius:"0.5rem", width:"40%" }} />
    </div>
  </div>
);

// ── Iniciais da empresa (avatar) ──────────────────────────────
function EmpresaAvatar({ nome, size = 56 }) {
  const initials = (nome || "?")
    .split(" ").slice(0, 2)
    .map(w => w[0]).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius:"0.75rem",
      background:"linear-gradient(135deg,rgba(201,169,110,0.2),rgba(160,120,64,0.1))",
      border:"1px solid rgba(201,169,110,0.2)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"Orbitron, sans-serif", fontWeight:700,
      fontSize: size > 40 ? "1.1rem" : "0.75rem",
      color:"#C9A96E", flexShrink:0,
    }}>
      {initials}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function Empresas() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [counts,   setCounts]   = useState({}); // { empresaId: { rochas, vagas } }
  const [loading,  setLoading]  = useState(true);
  const [busca,    setBusca]    = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1) Carrega empresas
        const snap = await getDocs(collection(db, "empresas"));
        const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setEmpresas(lista);

        // 2) Conta rochas e vagas por empresa
        const [rochasSnap, vagasSnap] = await Promise.all([
          getDocs(collection(db, "rochas")),
          getDocs(query(collection(db, "vagas"), where("ativa", "==", true))),
        ]);

        const c = {};
        lista.forEach(e => { c[e.id] = { rochas: 0, vagas: 0 }; });
        rochasSnap.docs.forEach(d => {
          const eid = d.data().empresaId;
          if (c[eid]) c[eid].rochas += 1;
        });
        vagasSnap.docs.forEach(d => {
          const eid = d.data().empresaId;
          if (c[eid]) c[eid].vagas += 1;
        });
        setCounts(c);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const empresasFiltradas = useMemo(() => {
    const t = busca.toLowerCase();
    if (!t) return empresas;
    return empresas.filter(e =>
      e.nome?.toLowerCase().includes(t) ||
      e.endereco?.toLowerCase().includes(t)
    );
  }, [empresas, busca]);

  return (
    <div
      style={{
        minHeight:"100vh", position:"relative",
        backgroundImage:`url(${fundoImage})`,
        backgroundSize:"cover", backgroundPosition:"center", backgroundAttachment:"fixed",
      }}
    >
      {/* Overlay */}
      <div style={{
        position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        background:"linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.75) 50%, rgba(10,10,10,0.95))",
      }} />

      <div style={{ position:"relative", zIndex:10, maxWidth:"72rem", margin:"0 auto", padding:"7rem 1.5rem 5rem" }}>

        {/* ── Cabeçalho ── */}
        <div style={{ marginBottom:"2.5rem" }}>
          <p style={{ fontFamily:"Orbitron, sans-serif", fontSize:"0.6rem", letterSpacing:"0.3em", textTransform:"uppercase", color:"#C9A96E", marginBottom:"0.5rem" }}>
            Marketplace
          </p>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
            <h1 style={{ fontFamily:"Orbitron, sans-serif", fontSize:"2rem", fontWeight:700, color:"white", letterSpacing:"0.04em" }}>
              Empresas
            </h1>
            {!loading && (
              <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.75rem" }}>
                {empresasFiltradas.length} {empresasFiltradas.length === 1 ? "empresa" : "empresas"}
              </p>
            )}
          </div>
        </div>

        {/* ── Busca ── */}
        <div style={{ position:"relative", maxWidth:"28rem", marginBottom:"2rem" }}>
          <span style={{ position:"absolute", left:"0.875rem", top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.25)", pointerEvents:"none" }}>
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Buscar por nome ou cidade…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{
              width:"100%", paddingLeft:"2.5rem", paddingRight:"1rem",
              paddingTop:"0.75rem", paddingBottom:"0.75rem",
              borderRadius:"0.75rem", fontSize:"0.875rem", color:"white",
              background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
              outline:"none", transition:"border-color 0.2s",
            }}
            onFocus={e => (e.target.style.borderColor = "rgba(201,169,110,0.5)")}
            onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
          />
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"1.25rem" }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : empresasFiltradas.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"8rem 0", textAlign:"center" }}>
            <div style={{ width:"3.5rem", height:"3.5rem", borderRadius:"50%", background:"rgba(201,169,110,0.07)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem" }}>
              <span style={{ color:"rgba(201,169,110,0.4)" }}><IconSearch /></span>
            </div>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.875rem" }}>Nenhuma empresa encontrada.</p>
            {busca && (
              <button onClick={() => setBusca("")}
                style={{ marginTop:"0.75rem", color:"#C9A96E", fontSize:"0.75rem", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"1.25rem" }}>
            {empresasFiltradas.map(emp => (
              <EmpresaCard
                key={emp.id}
                empresa={emp}
                rochas={counts[emp.id]?.rochas ?? 0}
                vagas={counts[emp.id]?.vagas ?? 0}
                onClick={() => navigate(`/empresa/${emp.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card de empresa ───────────────────────────────────────────
function EmpresaCard({ empresa, rochas, vagas, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius:"1rem", overflow:"hidden", cursor:"pointer",
        background:"#111111",
        border: hover ? "1px solid rgba(201,169,110,0.35)" : "1px solid rgba(255,255,255,0.06)",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hover ? "0 16px 48px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.3)",
        transition:"all 0.3s",
      }}
    >
      {/* Faixa superior decorativa */}
      <div style={{
        height:"6px",
        background: hover
          ? "linear-gradient(90deg,#C9A96E,#a07840)"
          : "rgba(255,255,255,0.04)",
        transition:"background 0.3s",
      }} />

      <div style={{ padding:"1.5rem" }}>
        {/* Avatar + nome */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:"1rem", marginBottom:"1rem" }}>
          <EmpresaAvatar nome={empresa.nome} />
          <div style={{ flex:1, minWidth:0 }}>
            <h3 style={{
              fontFamily:"Orbitron, sans-serif", fontSize:"0.82rem",
              fontWeight:700, letterSpacing:"0.04em",
              color: hover ? "#C9A96E" : "white",
              transition:"color 0.3s",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              marginBottom:"0.25rem",
            }}>
              {empresa.nome}
            </h3>
            {empresa.endereco && (
              <div style={{ display:"flex", alignItems:"center", gap:"0.375rem", color:"rgba(255,255,255,0.35)", fontSize:"0.75rem" }}>
                <IconPin />
                <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {empresa.endereco}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Separador */}
        <div style={{ height:"1px", background:"rgba(255,255,255,0.05)", marginBottom:"1rem" }} />

        {/* Contadores */}
        <div style={{ display:"flex", gap:"1rem" }}>
          <StatPill icon={<IconBox />} value={rochas} label={rochas === 1 ? "rocha" : "rochas"} />
          <StatPill icon={<IconBriefcase />} value={vagas} label={vagas === 1 ? "vaga" : "vagas"} />
          {empresa.telefone && (
            <div style={{ display:"flex", alignItems:"center", gap:"0.375rem", color:"rgba(255,255,255,0.25)", fontSize:"0.7rem", marginLeft:"auto" }}>
              <IconPhone />{empresa.telefone}
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{
          marginTop:"1.25rem", display:"flex", alignItems:"center", gap:"0.375rem",
          fontSize:"0.7rem", letterSpacing:"0.1em", textTransform:"uppercase",
          color: hover ? "#C9A96E" : "rgba(255,255,255,0.2)",
          transition:"color 0.3s",
        }}>
          Ver perfil completo <IconArrow />
        </div>
      </div>
    </div>
  );
}

// ── Pílula de estatística ─────────────────────────────────────
function StatPill({ icon, value, label }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:"0.375rem",
      padding:"0.375rem 0.75rem", borderRadius:"9999px",
      background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)",
      fontSize:"0.75rem", color:"rgba(255,255,255,0.5)",
    }}>
      <span style={{ color:"#C9A96E" }}>{icon}</span>
      <span style={{ fontWeight:600, color:"rgba(255,255,255,0.8)" }}>{value}</span>
      <span>{label}</span>
    </div>
  );
}
