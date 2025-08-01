// src/components/ListaRochas.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import fundoImage from "../img/fundo.png";

export default function ListaRochas() {
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
      className="min-h-screen bg-cover bg-center bg-no-repeat relative pt-20" // pt-16 é padding-top (64px)
      style={{ backgroundImage: `url(${fundoImage})` }}
    >
      {/* Overlay branco transparente - pode remover ou ajustar opacidade */}
      <div className="absolute inset-0 bg-white/10 pointer-events-none z-0" />
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">Lista de Rochas</h2>

        <input
          type="text"
          placeholder="Pesquisar por nome, tipo ou empresa..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full p-3 mb-6 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
        />

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
                src={`https://www.google.com/maps?q=${encodeURIComponent(empresaSelecionada.endereco)}&output=embed`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
