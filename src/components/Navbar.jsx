import { useState, useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
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
      { to: "/lista", label: "Rochas Ornamentais", show: true },
      { to: "/servicos", label: "Serviços", show: true },
      { to: "/arquitetos", label: "Arquitetos", show: true },
      { to: "/construtoras", label: "Construtoras", show: true },
      { to: "/transportadores", label: "Transportadores", show: true },
      { to: "/vagas", label: "Vagas de Emprego", show: true },
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
      <div className="flex h-20 items-center px-4 justify-between">
        {/* ESQUERDA - HOME */}
        <div className="flex-1">
          <NavLink to="/" className={linkClass}>
            Home
          </NavLink>
        </div>

        {/* CENTRO - LINKS */}
        <div className="hidden md:flex flex-grow gap-6 items-center justify-center min-w-max">

          {navLinks
            .filter((l) => l.show)
            .map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
        </div>

        {/* DIREITA - LOGO + LOGIN/SAIR */}
        <div className="flex items-center justify-end flex-1 space-x-4 pr-4">
          {/* <img src={logo} alt="Logo" className="h-32 w-auto object-contain" /> */}
          {!user ? (
            <button
              onClick={() => navigate("/login")}
              className="border hover:text-gray-300 text-white font-semibold py-2 px-4 rounded"
            >
              Entrar
            </button>
          ) : (
            <button
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="rounded-lg border border-gray-500 bg-transparent px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition"
            >
              Sair
            </button>
          )}
        </div>

        {/* BOTÃO MOBILE */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-md border border-gray-600 p-2 text-gray-200 hover:bg-gray-800"
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
