// src/components/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from("usuarios")
      .select("*, empresas(id, nome, endereco, telefone, cnpj)")
      .eq("id", userId)
      .single();

    if (error || !data) {
      setProfile(null);
    } else {
      setProfile({
        id:        data.id,
        role:      data.role,
        companyId: data.empresa_id,
        empresa:   data.empresas ?? null,
      });
    }
  };

  useEffect(() => {
    // Carregar sessão inicial
    const loadInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user ?? null;
      setUser(u);
      if (u) await fetchProfile(u.id);
      setLoading(false);
    };

    loadInitialSession();

    // Listener de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
      const u = session?.user ?? null;
        setUser(u);
        
        if (u) {
          await fetchProfile(u.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Logout melhorado
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Erro no signOut:", error);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error("Erro inesperado no logout:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
