import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase"; // Certifique-se que firebase.js está dentro de src/
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "./context/AuthContext"; // ajuste o caminho conforme a sua estrutura real
import fundoImage from "../img/fundo.png";

export default function ListaRochas() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === "admin";
  const isEmpresa = profile?.role === "empresa";

  const [rochas, setRochas] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [m2, setM2] = useState("");

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

  const adicionarEstoque = async (rochaId) => {
    if (!m2) return alert("Informe o m² a adicionar.");
    const ref = doc(db, "rochas", rochaId);
    const r = rochas.find((r) => r.id === rochaId);
    const novoM2 = (r.m2 || 0) + Number(m2);
    await updateDoc(ref, { m2: novoM2 });
    alert("Estoque atualizado!");
    setM2("");
    setEmpresaSelecionada(null);
    window.location.reload();
  };

  const deletarRocha = async (rochaId) => {
    if (!window.confirm("Tem certeza que deseja deletar esta rocha?")) return;
    await deleteDoc(doc(db, "rochas", rochaId));
    alert("Rocha deletada.");
    setEmpresaSelecionada(null);
    window.location.reload();
  };

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
      className="min-h-screen bg-cover bg-center bg-no-repeat relative pt-24 px-4"
      style={{ backgroundImage: `url(${fundoImage})` }}
    >
      <div className="absolute inset-0 bg-white/10 pointer-events-none z-0" />
      <div className="max-w-5xl mx-auto relative z-10">
        {empresaSelecionada ? (
          <>
            <button
              onClick={() => setEmpresaSelecionada(null)}
              className="mb-6 px-5 py-2 rounded-lg bg-gray-900 text-white hover:bg-black transition"
            >
              ← Voltar à lista
            </button>
            {rochas
              .filter((r) => r.empresa?.id === empresaSelecionada.id)
              .map((rocha) => {
                console.log("DEBUG:", profile?.id, rocha.empresa?.id);
                return (
                  <div
                    key={rocha.id}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8 mx-auto max-w-4xl shadow-lg text-white space-y-6"
                  >
                    {rocha.fotoUrl && (
                      <img
                        src={rocha.fotoUrl}
                        alt={rocha.nome}
                        className="w-full max-h-[500px] object-cover rounded-lg mx-auto shadow-lg"
                      />
                    )}
                    <h3 className="text-4xl font-bold text-center">{rocha.nome}</h3>
                    <p>
                      <strong>Empresa:</strong> {rocha.empresa?.nome || "-"}
                    </p>
                    <p>
                      <strong>Tipo:</strong> {rocha.tipo}
                    </p>
                    <p>
                      <strong>Acabamento:</strong> {rocha.acabamento}
                    </p>
                    <p>
                      <strong>Estoque (m²):</strong> {rocha.m2 || 0}
                    </p>

                    {isEmpresa && profile?.id === rocha.empresa?.id && (
                      <div className="space-y-4">
                        <input
                          type="number"
                          placeholder="m² a adicionar"
                          value={m2}
                          onChange={(e) => setM2(e.target.value)}
                          className="w-full p-2 rounded border border-white/30 bg-white/20 text-white placeholder-white/70"
                        />
                        <button
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
                          onClick={() => adicionarEstoque(rocha.id)}
                        >
                          Adicionar m²
                        </button>
                        <button
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full"
                          onClick={() => deletarRocha(rocha.id)}
                        >
                          Deletar Rocha
                        </button>
                      </div>
                    )}

                    {rocha.empresa?.endereco && (
                      <div className="mt-8">
                        <h4 className="text-xl font-semibold mb-3">
                          Localização da empresa:
                        </h4>
                        <div className="w-full h-96 rounded-lg overflow-hidden">
                          <iframe
                            title="mapa"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            src={`https://www.google.com/maps?q=${encodeURIComponent(
                              rocha.empresa.endereco
                            )}&output=embed`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </>
        ) : (
          <>
            <div className="relative w-full mb-6">
              <input
                type="text"
                placeholder="Pesquisar por nome, tipo ou empresa..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full pl-10 p-3 rounded-xl bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-60 border border-white/20 backdrop-blur-md shadow-lg"
              />
            </div>

            {(isAdmin || isEmpresa) && (
              <div className="flex justify mb-6 gap-4">
                <button
                  onClick={() => navigate("/cadastro-rocha")}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Cadastrar Nova Rocha
                </button>
              </div>
            )}

            {rochasFiltradas.length === 0 ? (
              <p className="text-center text-gray-300">Nenhuma rocha encontrada.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rochasFiltradas.map((rocha) => (
                  <div
                    key={rocha.id}
                    className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 shadow-lg hover:scale-105 transition cursor-pointer"
                    onClick={() => setEmpresaSelecionada(rocha.empresa)}
                  >
                    {rocha.fotoUrl && (
                      <img
                        src={rocha.fotoUrl}
                        alt={rocha.nome}
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h3 className="text-2xl font-bold text-white text-center mb-2">
                      {rocha.nome}
                    </h3>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
