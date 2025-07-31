// src/components/CadastroUsuario.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

export default function CadastroUsuario() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState("empresa"); // 'empresa' ou 'admin'
  const [empresas, setEmpresas] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");

  useEffect(() => {
    const carregarEmpresas = async () => {
      const snap = await getDocs(collection(db, "empresas"));
      setEmpresas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    carregarEmpresas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Criando usuário...");
    setStatusType("");

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = cred.user.uid;

      const payload = role === "empresa" ? { role, companyId } : { role };
      if (role === "empresa" && !companyId) {
        setStatus("Selecione uma empresa para o usuário do tipo empresa.");
        setStatusType("error");
        return;
      }

      await setDoc(doc(db, "usuarios", uid), payload);

      setStatus("Usuário criado com sucesso!");
      setStatusType("success");
      setEmail(""); setSenha(""); setRole("empresa"); setCompanyId("");
    } catch (err) {
      let msg = "Erro ao criar usuário.";
      if (err.code === "auth/email-already-in-use") msg = "Email já está em uso.";
      else if (err.code === "auth/invalid-email") msg = "Email inválido.";
      else if (err.code === "auth/weak-password") msg = "Senha muito fraca (mín. 6).";
      setStatus(msg); setStatusType("error");
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">Cadastrar Usuário</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input className="w-full p-3 rounded-lg border border-gray-300" type="email" placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="w-full p-3 rounded-lg border border-gray-300" type="password" placeholder="Senha"
            value={senha} onChange={(e) => setSenha(e.target.value)} required />

          <select className="w-full p-3 rounded-lg border border-gray-300"
            value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="empresa">Empresa</option>
            <option value="admin">Admin</option>
          </select>

          {role === "empresa" && (
            <select className="w-full p-3 rounded-lg border border-gray-300"
              value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
              <option value="">Selecione a empresa</option>
              {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
            </select>
          )}

          <button type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition">
            Criar Usuário
          </button>
        </form>
        {status && (
          <p className={`mt-4 text-sm text-center ${statusType === "success" ? "text-green-600" : "text-red-600"}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
