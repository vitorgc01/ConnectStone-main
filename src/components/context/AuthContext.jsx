// src/components/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Busca o perfil do usuário na tabela `usuarios`
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*, empresas(id, nome, endereco, telefone, cnpj)")
      .eq("id", userId)
      .single();

    if (error || !data) {
      setProfile(null);
    } else {
      // Achata empresa para manter compatibilidade com o código existente
      setProfile({
        id:        data.id,
        role:      data.role,
        companyId: data.empresa_id,
        empresa:   data.empresas ?? null,
      });
    }
  };

  useEffect(() => {
    // Sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id).finally(() => setLoading(false));
      else    setLoading(false);
    });

    // Listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) await fetchProfile(u.id);
        else    setProfile(null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const logout = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
