// src/components/Login.jsx
import { useState } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import fundo from "../img/Sub.png"; // <- import direto da imagem
import logoAvantec from "../img/LogoAvantec.png";


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
      style={{ backgroundImage: `url(${fundo})` }}
    >
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20">
      <img src={logoAvantec} alt="Logo" className="mx-auto mb-14 w-60" />
        {/* <h2 className="text-3xl font-semibold mb-6 text-white text-center">Entrar</h2> */}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Campo de Login com ícone */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="white">
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8V22h19.2v-2.8c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </span>
            <input
              type="email"
              placeholder="Login"
              className="w-full p-3 pl-10 rounded-lg border border-white/30 bg-transparent text-white placeholder-white focus:ring-2 focus:ring-white outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Campo de Senha com ícone */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="white">
                <path d="M0 0h24v24H0V0z" fill="none" />
                <path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-9h-1V6a5 5 0 00-10 0v2H6c-1.1 0-2 .9-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9c0-1.1-.9-2-2-2zm-6-3a3 3 0 013 3v2H9V8a3 3 0 013-3zm6 14H6v-9h12v9z" />
              </svg>
            </span>
            <input
              type="password"
              placeholder="Senha"
              className="w-full p-3 pl-10 rounded-lg border border-white/30 bg-transparent text-white placeholder-white focus:ring-2 focus:ring-white outline-none"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-white/20 text-white py-3 rounded-lg hover:bg-white/30 transition font-medium"
          >
            Entrar
          </button>
        </form>

        {status && (
          <p
            className={`mt-4 text-sm text-center ${statusType === "success" ? "text-green-400" : "text-red-400"
              }`}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );

}
