// src/App.jsx

import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/context/AuthContext";

import Navbar from "./components/Navbar";

const Home = lazy(() => import("./components/Pages/Home"));
const Login = lazy(() => import("./components/Login"));
const ListaRochas = lazy(() => import("./components/ListaRochas"));
const CadastroRocha = lazy(() => import("./components/CadastroRocha"));
const CadastroEmpresa = lazy(() => import("./components/CadastroEmpresa"));
const CadastroUsuario = lazy(() => import("./components/CadastroUsuario"));
const Estoque = lazy(() => import("./components/Pages/Estoque"));
const Vagas = lazy(() => import("./components/Pages/Vagas"));
const Empresas = lazy(() => import("./components/Pages/Empresas"));
const EmpresaPerfil = lazy(() => import("./components/Pages/EmpresaPerfil"));
const EmBreve = lazy(() => import("./components/Pages/EmBreve"));
// import TesteUpload from "./teste";

/** Rota que exige usuário logado */
// function PrivateRoute({ children }) {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return <div className="p-6">Carregando...</div>;
//   }

//   return user ? children : <Navigate to="/login" replace />;
// }

/** Rota exclusiva de admin */
function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return user && profile?.role === "admin"
    ? children
    : <Navigate to="/" replace />;
}

/** Rota para admin OU empresa */
function EmpresaOuAdminRoute({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (
    user &&
    (profile?.role === "admin" || profile?.role === "empresa")
  ) {
    return children;
  }

  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Navbar />

        <Suspense fallback={<div className="min-h-screen bg-black p-6 pt-28 text-white">Carregando...</div>}>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Home />} />

          <Route
            path="/lista"
            element={<ListaRochas />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/vagas"
            element={<Vagas />}
          />

          <Route
            path="/empresas"
            element={<Empresas />}
          />

          <Route
            path="/empresa/:id"
            element={<EmpresaPerfil />}
          />

          {[
            "/servicos",
            "/arquitetos",
            "/construtoras",
            "/transportadores",
          ].map((path) => (
            <Route key={path} path={path} element={<EmBreve />} />
          ))}

          {/* <Route
            path="/teste-upload"
            element={<TesteUpload />}
          /> */}

          {/* Protegidas */}
          <Route
            path="/cadastro-rocha"
            element={
              <EmpresaOuAdminRoute>
                <CadastroRocha />
              </EmpresaOuAdminRoute>
            }
          />

          <Route
            path="/cadastro-empresa"
            element={
              <AdminRoute>
                <CadastroEmpresa />
              </AdminRoute>
            }
          />

          <Route
            path="/cadastro-usuario"
            element={
              <AdminRoute>
                <CadastroUsuario />
              </AdminRoute>
            }
          />

          <Route
            path="/estoque"
            element={
              <EmpresaOuAdminRoute>
                <Estoque />
              </EmpresaOuAdminRoute>
            }
          />

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  );
}
