// src/components/Login.jsx
import { useState } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Entrando...");
    setStatusType("");

    try {
      const cred = await signInWithEmailAndPassword(auth, email, senha);
      const uid = cred.user.uid;
      const snap = await getDoc(doc(db, "usuarios", uid));

      if (!snap.exists()) {
        setStatus("Usuário não cadastrado no sistema.");
        setStatusType("error");
        return;
      }

      setStatus("Login efetuado!");
      setStatusType("success");
      navigate("/");
    } catch (error) {
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setStatus("Email ou senha inválidos.");
      } else {
        setStatus("Erro no login: " + error.message);
      }
      setStatusType("error");
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <h2 className="text-3xl font-semibold mb-6 text-gray-800 text-center">Entrar</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
          >
            Entrar
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
