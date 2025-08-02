import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useAuth } from "../components/context/AuthContext";
import fundoImage from "../img/fundo.png";

export default function ListaRochas() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === "admin";
  const isEmpresa = profile?.role === "empresa";

  const [rochas, setRochas] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);

  useEffect(() => {
    const buscarRochas = async () => {
      const snap = await getDocs(collection(db, "rochas"));
      const lista = await Promise.all(
        snap.docs.map(async (d) => {
          const r = { id: d.id, ...d.data() };
          let empresa = null;
          if (r.empresaId) {
            const eSnap = await getDoc(doc(db, "empresas", r.empresaId));
            empresa = eSnap.exists() ? { id: eSnap.id, ...eSnap.data() } : null;
          }
          return { ...r, empresa };
        })
      );
      setRochas(lista);
    };
    buscarRochas();
  }, []);

  const rochasFiltradas = rochas.filter((r) => {
    const termo = filtro.toLowerCase();
    return (
      r.nome?.toLowerCase().includes(termo) ||
      r.tipo?.toLowerCase().includes(termo) ||
      r.empresa?.nome?.toLowerCase().includes(termo)
    );
  });

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative pt-24"
      style={{ backgroundImage: `url(${fundoImage})` }}
    >
      <div className="absolute inset-0 bg-white/10 pointer-events-none z-0" />
      <div className="max-w-5xl mx-auto relative z-10 px-4">
        <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">
          Lista de Rochas
        </h2>

        <div className="relative w-full mb-6">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Pesquisar por nome, tipo ou empresa..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full pl-10 p-3 border border-gray-300 rounded-xl shadow-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-500 transition"
          />
        </div>

        {(isAdmin || isEmpresa) && (
          <div className="flex justify mb-6">
            <button
              onClick={() => navigate("/cadastro-rocha")}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-black transition"
            >
              Cadastrar Rocha
            </button>
          </div>
        )}

        

        {rochasFiltradas.length === 0 ? (
          <p className="text-center text-gray-500">Nenhuma rocha encontrada.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rochasFiltradas.map((rocha) => (
              <div
                key={rocha.id}
                onClick={() => setEmpresaSelecionada(rocha.empresa)}
                className="bg-white shadow-md rounded-lg p-4 flex gap-4 items-center cursor-pointer transform transition duration-300 hover:scale-105 hover:bg-blue-50"
              >
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{rocha.nome}</h3>
                  <p className="text-sm text-gray-600">Empresa: {rocha.empresa?.nome || "-"}</p>
                  <p className="text-sm text-gray-600">Tipo: {rocha.tipo}</p>
                  <p className="text-sm text-gray-600">Acabamento: {rocha.acabamento}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {empresaSelecionada?.endereco && (
          <div className="mt-10">
            <h3 className="text-xl font-semibold text-center mb-2">
              Localização da empresa: {empresaSelecionada.nome}
            </h3>
            <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-lg">
              <iframe
                title="mapa"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  empresaSelecionada.endereco
                )}&output=embed`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
