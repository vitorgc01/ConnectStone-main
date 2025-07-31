// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/context/AuthContext"; // ajuste o caminho se seu AuthContext estiver em outro lugar
import Navbar from "./components/Navbar";
import Home from "./components/Pages/Home";
import Login from "./components/Login";
import ListaRochas from "./components/ListaRochas";
import CadastroRocha from "./components/CadastroRocha";
import CadastroEmpresa from "./components/CadastroEmpresa";
import CadastroUsuario from "./components/CadastroUsuario";
import Estoque from "./components/Pages/Estoque";

/** Rota que exige usuário logado (sem checar role) */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6">Carregando...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

/** Rota exclusiva de admin */
function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="p-6">Carregando...</div>;

  // Aguarda o profile chegar do Firestore antes de decidir
  if (user && profile == null) return <div className="p-6">Carregando perfil...</div>;

  return user && profile?.role === "admin" ? children : <Navigate to="/" replace />;
}

/** Rota para admin OU empresa */
function EmpresaOuAdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="p-6">Carregando...</div>;

  // Aguarda o profile chegar do Firestore antes de decidir
  if (user && profile == null) return <div className="p-6">Carregando perfil...</div>;

  if (user && (profile?.role === "admin" || profile?.role === "empresa")) {
    return children;
  }
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/lista" element={<ListaRochas />} />
          <Route path="/login" element={<Login />} />

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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
