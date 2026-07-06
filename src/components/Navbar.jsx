import { useState, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";
import logo from "../img/LogoAvantec.png";

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isAdmin = profile?.role === "admin";
  const isEmpresa = profile?.role === "empresa";

  const navLinks = useMemo(
    () => [
      { to: "/lista",         label: "Rochas Ornamentais", show: true },
      { to: "/empresas",      label: "Empresas",           show: true },
      { to: "/servicos",      label: "Serviços",           show: true },
      { to: "/arquitetos",    label: "Arquitetos",         show: true },
      { to: "/construtoras",  label: "Construtoras",       show: true },
      { to: "/transportadores",label: "Transportadores",   show: true },
      { to: "/vagas",         label: "Vagas de Emprego",   show: true },
    ],
    []
  );

  const linkClass = ({ isActive }) =>
    [
      "relative group px-3 py-2 text-sm md:text-base transition-colors",
      isActive ? "text-white" : "text-white hover:text-gray-300",
      "after:content-[''] after:absolute after:left-3 after:right-3 after:-bottom-0.5",
      "after:h-[2px] after:bg-white after:scale-x-0 group-hover:after:scale-x-100 after:origin-left after:transition-transform after:duration-300",
      isActive ? "after:scale-x-100" : "",
    ].join(" ");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/10 backdrop-blur font-navbar">
      <div className="max-w-7xl mx-auto flex h-20 items-center px-4 md:px-8 justify-between w-full">
        
        {/* ESQUERDA - HOME */}
        <div className="flex-shrink-0">
          <NavLink to="/" className={linkClass}>
            Home
          </NavLink>
        </div>

        {/* CENTRO - LINKS */}
        <div className="hidden md:flex flex-1 justify-center gap-4 lg:gap-6 items-center min-w-0">
          {navLinks
            .filter((l) => l.show)
            .map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
        </div>

        {/* DIREITA - BOTÃO ENTRAR / SAIR */}
        <div className="flex items-center justify-end flex-shrink-0 space-x-4">
          {!user ? (
            <button
              onClick={() => navigate("/login")}
              className="border border-white/70 hover:bg-white hover:text-black text-white font-semibold py-2 px-5 rounded transition-all whitespace-nowrap"
            >
              Entrar
            </button>
          ) : (
            <button
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="rounded-lg border border-gray-500 bg-transparent px-5 py-2 text-sm text-gray-200 hover:bg-gray-800 transition whitespace-nowrap"
            >
              Sair
            </button>
          )}
        </div>

        {/* BOTÃO MOBILE */}
        <button
          className="md:hidden ml-4 inline-flex items-center justify-center rounded-md border border-gray-600 p-2 text-gray-200 hover:bg-gray-800"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
        >
          {!open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
