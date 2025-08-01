// src/components/Login.jsx
import { useState } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import fundo from "../img/Sub.png"; // <- import direto da imagem

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
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center px-4"
      style={{ backgroundImage: `url(${fundo})` }} // <- usando imagem importada
    >
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20">
        <h2 className="text-3xl font-semibold mb-6 text-white text-center">Entrar</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            placeholder="Login"
            className="w-full p-3 rounded-lg border border-white/30 bg-transparent text-white placeholder-white focus:ring-2 focus:ring-white outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            className="w-full p-3 rounded-lg border border-white/30 bg-transparent text-white placeholder-white focus:ring-2 focus:ring-white outline-none"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-white/20 text-white py-3 rounded-lg hover:bg-white/30 transition font-medium"
          >
            Entrar
          </button>
        </form>

        {status && (
          <p
            className={`mt-4 text-sm text-center ${
              statusType === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
