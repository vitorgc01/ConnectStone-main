import { useState } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function CadastroEmpresa() {
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Salvando...");
    setStatusType("");

    try {
      // 1) Cria a empresa no Firestore
      const empresaRef = await addDoc(collection(db, "empresas"), {
        nome,
        endereco,
        criadoEm: new Date(),
      });

      // 2) Cria o usuário Auth (email/senha)
      const cred = await createUserWithEmailAndPassword(auth, email, senha);

      // 3) Cria o perfil em `usuarios` vinculando à empresa
      await setDoc(doc(db, "usuarios", cred.user.uid), {
        role: "empresa",
        companyId: empresaRef.id,
      });

      setStatus("Empresa e usuário criados com sucesso!");
      setStatusType("success");
      setNome("");
      setEndereco("");
      setEmail("");
      setSenha("");
    } catch (err) {
      console.error(err);

      let msg = "Erro ao cadastrar empresa.";
      if (err.code === "auth/email-already-in-use") {
        msg = "O email já está em uso.";
      } else if (err.code === "auth/weak-password") {
        msg = "A senha deve ter pelo menos 6 caracteres.";
      }

      setStatus(msg);
      setStatusType("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">Cadastrar Empresa</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="Nome da empresa"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300"
          />
          <input
            type="text"
            placeholder="Endereço completo da empresa"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            required
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300"
          />
          <input
            type="email"
            placeholder="Email de acesso"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300"
          />
          <input
            type="password"
            placeholder="Senha de acesso"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300"
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-black to-gray-800 text-white py-3 rounded-lg hover:from-gray-900 hover:to-black transition"
          >
            Cadastrar
          </button>
        </form>
        {status && (
          <p
            className={`mt-4 text-sm text-center ${
              statusType === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
