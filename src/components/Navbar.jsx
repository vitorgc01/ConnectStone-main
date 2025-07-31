import { useState, useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isAdmin = profile?.role === "admin";
  const isEmpresa = profile?.role === "empresa";

  const baseLinks = useMemo(
    () => [
      { to: "/", label: "Home", show: true },
      { to: "/lista", label: "Lista de Rochas", show: true },
      { to: "/estoque", label: "Estoque", show: isAdmin || isEmpresa },
      { to: "/cadastro-rocha", label: "Cadastro Rocha", show: isAdmin || isEmpresa },
      { to: "/cadastro-empresa", label: "Cadastro Empresa", show: isAdmin },
      { to: "/cadastro-usuario", label: "Cadastro Usuário", show: isAdmin },
    ],
    [isAdmin, isEmpresa]
  );

  const linkClass = ({ isActive }) =>
    [
      "relative group px-3 py-2 text-sm md:text-base transition-colors",
      isActive ? "text-black" : "text-gray-600 hover:text-black",
      // sublinhado animado (monocromático)
      "after:content-[''] after:absolute after:left-3 after:right-3 after:-bottom-0.5",
      "after:h-[2px] after:bg-black after:scale-x-0 group-hover:after:scale-x-100 after:origin-left after:transition-transform after:duration-300",
      isActive ? "after:scale-x-100" : "",
    ].join(" ");

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur font-navbar">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Marca */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="select-none text-lg md:text-xl font-semibold tracking-wide text-black"
            >
              Connect Stone
            </Link>
          </div>

          {/* Centro: links (desktop) */}
          <nav className="hidden md:flex items-center justify-center gap-1">
            {baseLinks
              .filter(l => l.show)
              .map(link => (
                <NavLink key={link.to} to={link.to} className={linkClass}>
                  {link.label}
                </NavLink>
              ))}
          </nav>

          {/* Ações (direita) */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <button
                onClick={() => navigate("/login")}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition"
              >
                Entrar
              </button>
            ) : (
              <button
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition"
              >
                Sair
              </button>
            )}
          </div>

          {/* Botão mobile */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md border border-gray-300 p-2 text-gray-700 hover:bg-gray-100"
            onClick={() => setOpen(v => !v)}
            aria-label="Abrir menu"
          >
            {/* Ícone hambúrguer / X (monocromático) */}
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
      </div>

      {/* Menu mobile (monocromático) */}
      <div
        className={[
          "md:hidden border-t border-gray-200 bg-white",
          open ? "block" : "hidden",
        ].join(" ")}
      >
        <nav className="mx-auto max-w-6xl px-3 py-3">
          <div className="flex flex-col">
            {baseLinks
              .filter(l => l.show)
              .map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    [
                      "px-3 py-2 rounded-md text-sm transition-colors",
                      isActive ? "bg-gray-100 text-black" : "text-gray-700 hover:bg-gray-100 hover:text-black",
                    ].join(" ")
                  }
                >
                  {link.label}
                </NavLink>
              ))}

            <div className="mt-2 border-t border-gray-200 pt-3">
              {!user ? (
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/login");
                  }}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 transition"
                >
                  Entrar
                </button>
              ) : (
                <button
                  onClick={async () => {
                    await logout();
                    setOpen(false);
                    navigate("/");
                  }}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 transition"
                >
                  Sair
                </button>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
