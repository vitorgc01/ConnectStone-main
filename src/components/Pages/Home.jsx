// src/components/Pages/Home.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import fundoImage from "../../img/fundo.png";
import logoBranca from "../../img/logoBranca.png";

const categorias = [
  {
    label: "Rochas Ornamentais",
    desc: "Mármores, granitos e quartzitos de todo o Brasil",
    to: "/lista",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.4}>
        <path d="M3 21h18M5 21V7l7-4 7 4v14" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="9" y="13" width="6" height="8" rx="0.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Serviços",
    desc: "Corte, polimento, instalação e beneficiamento",
    to: "/servicos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.4}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Arquitetos",
    desc: "Conecte-se com profissionais de arquitetura",
    to: "/arquitetos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.4}>
        <path d="M2 20h20M4 20V10l8-6 8 6v10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 20v-5h4v5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Construtoras",
    desc: "Empresas de construção civil e incorporadoras",
    to: "/construtoras",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.4}>
        <rect x="2" y="7" width="20" height="14" rx="1" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" strokeLinecap="round" />
        <line x1="12" y1="12" x2="12" y2="16" strokeLinecap="round" />
        <line x1="10" y1="14" x2="14" y2="14" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Transportadores",
    desc: "Logística especializada em rochas ornamentais",
    to: "/transportadores",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.4}>
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 3v5h-7V8z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    label: "Vagas de Emprego",
    desc: "Oportunidades no setor de rochas ornamentais",
    to: "/vagas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.4}>
        <rect x="2" y="7" width="20" height="14" rx="1" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" strokeLinecap="round" />
        <line x1="12" y1="12" x2="12" y2="16" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Home() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [avisos, setAvisos] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animação de entrada
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "avisos"), orderBy("publicadoEm", "desc"))
        );
        setAvisos(snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) })));
      } catch {
        setAvisos([]);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">

      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center"
        style={{
          backgroundImage: `url(${fundoImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay em gradiente */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#0A0A0A]" />

        {/* Conteúdo hero */}
        <div
          className="relative z-10 flex flex-col items-center text-center px-6"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 1s ease, transform 1s ease",
          }}
        >
          <img
            src={logoBranca}
            alt="Connect Stone"
            className="w-72 sm:w-96 md:w-[480px] mb-10 drop-shadow-2xl"
          />

          <p
            className="text-white/60 text-base sm:text-lg max-w-xl leading-relaxed mb-10"
            style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.05em" }}
          >
            O marketplace do setor de mármores e granitos.
            <br />
            Conecte fornecedores, compradores e profissionais.
          </p>

          <div className="flex gap-4 flex-wrap justify-center">
            <button
              onClick={() => navigate("/lista")}
              className="px-8 py-3 rounded-lg text-sm font-semibold tracking-widest uppercase transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #C9A96E, #a07840)",
                color: "#0A0A0A",
                boxShadow: "0 0 24px rgba(201,169,110,0.35)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 0 36px rgba(201,169,110,0.55)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 0 24px rgba(201,169,110,0.35)"}
            >
              Ver Rochas
            </button>
            <button
              onClick={() => navigate("/vagas")}
              className="px-8 py-3 rounded-lg text-sm font-semibold tracking-widest uppercase border border-white/20 text-white/80 hover:border-white/50 hover:text-white transition-all duration-300"
            >
              Ver Vagas
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-xs tracking-widest uppercase text-white/60">Explorar</span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
            <rect x="1" y="1" width="14" height="22" rx="7" stroke="white" strokeWidth="1.2" />
            <circle cx="8" cy="7" r="2" fill="white">
              <animate attributeName="cy" values="7;15;7" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      </section>

      {/* ── DIVISOR ── */}
      <div className="w-full flex items-center justify-center py-2">
        <div className="h-px w-1/3 bg-gradient-to-r from-transparent via-[#C9A96E]/40 to-transparent" />
        <div className="mx-4 w-1.5 h-1.5 rounded-full bg-[#C9A96E]/60" />
        <div className="h-px w-1/3 bg-gradient-to-l from-transparent via-[#C9A96E]/40 to-transparent" />
      </div>

      {/* ── CATEGORIAS ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-14 text-center">
          <p className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase mb-3" style={{ fontFamily: "Orbitron, sans-serif" }}>
            Marketplace
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: "Orbitron, sans-serif", letterSpacing: "0.04em" }}
          >
            O que você encontra aqui
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categorias.map((cat) => (
            <button
              key={cat.to}
              onClick={() => navigate(cat.to)}
              className="group text-left rounded-xl p-6 border transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "linear-gradient(145deg, #161616, #111111)",
                borderColor: "rgba(255,255,255,0.07)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(201,169,110,0.4)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(201,169,110,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                className="mb-4 w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300"
                style={{ background: "rgba(201,169,110,0.1)", color: "#C9A96E" }}
              >
                {cat.icon}
              </div>
              <h3
                className="text-white font-semibold text-base mb-1 group-hover:text-[#C9A96E] transition-colors duration-300"
                style={{ fontFamily: "Orbitron, sans-serif", letterSpacing: "0.03em", fontSize: "0.85rem" }}
              >
                {cat.label}
              </h3>
              <p className="text-white/40 text-sm leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                {cat.desc}
              </p>
              <div className="mt-4 flex items-center gap-1 text-[#C9A96E]/60 text-xs tracking-widest uppercase group-hover:text-[#C9A96E] transition-colors duration-300">
                Acessar
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── AVISOS (se houver) ── */}
      {avisos.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "#111111" }}>
            <div className="px-6 py-4 border-b border-white/8 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#C9A96E] animate-pulse" />
              <span className="text-xs tracking-widest uppercase text-white/50" style={{ fontFamily: "Orbitron, sans-serif" }}>
                Avisos
              </span>
            </div>
            <div className="divide-y divide-white/5">
              {avisos.slice(0, 3).map((a) => (
                <div key={a.id} className="px-6 py-5">
                  <p className="text-white/80 font-medium text-sm mb-1">{a.titulo || "Aviso"}</p>
                  <p className="text-white/40 text-sm leading-relaxed">{a.mensagem || ""}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── RODAPÉ SIMPLES ── */}
      <footer className="border-t border-white/5 py-10 text-center">
        <p className="text-white/20 text-xs tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>
          © {new Date().getFullYear()} Connect Stone · Desenvolvido por Avantec
        </p>
      </footer>
    </div>
  );
}
