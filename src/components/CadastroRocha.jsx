// src/components/CadastroRocha.jsx
import { useEffect, useState } from "react";
import { db, storage } from "../firebase";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  runTransaction,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../components/context/AuthContext";

export default function CadastroRocha() {
  const { user, profile, loading } = useAuth();
  const isAdmin = profile?.role === "admin";
  const isEmpresa = profile?.role === "empresa";

  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaId] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [acabamento, setAcabamento] = useState("");
  const [entradaInicial, setEntradaInicial] = useState("");
  const [imagem, setImagem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (loading) return;

    const load = async () => {
      try {
        if (isAdmin) {
          const snap = await getDocs(collection(db, "empresas"));
          setEmpresas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } else if (isEmpresa && profile?.companyId) {
          const empSnap = await getDoc(doc(db, "empresas", profile.companyId));
          if (empSnap.exists()) {
            setEmpresaId(empSnap.id);
            setEmpresaNome(empSnap.data().nome || "");
          } else {
            setStatus("Empresa vinculada não encontrada.");
            setStatusType("error");
          }
        }
      } catch (e) {
        console.error(e);
        setStatus("Erro ao carregar empresas.");
        setStatusType("error");
      }
    };

    load();
  }, [loading, isAdmin, isEmpresa, profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Salvando...");
    setStatusType("");
    setSalvando(true);

    try {
      const finalEmpresaId = isEmpresa ? profile?.companyId : empresaId;
      if (!finalEmpresaId) {
        setStatus("Selecione a empresa (ou verifique seu vínculo).");
        setStatusType("error");
        setSalvando(false);
        return;
      }

      let fotoUrl = "";
      if (imagem) {
        // Sanitizar o nome do arquivo para evitar caracteres especiais
        const safeName = imagem.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remove acentos
          .replace(/\s+/g, "_"); // Troca espaços por underline

        const imageRef = ref(storage, `rochas/${Date.now()}_${safeName}`);
        const snap = await uploadBytes(imageRef, imagem);
        fotoUrl = await getDownloadURL(snap.ref);
      }

      const rochaRef = await addDoc(collection(db, "rochas"), {
        empresaId: finalEmpresaId,
        nome,
        tipo,
        acabamento,
        fotoUrl,
        criadoEm: new Date(),
      });

      const m2 = Number(entradaInicial || 0);
      if (m2 > 0 && user?.uid) {
        await addDoc(collection(db, "rochas", rochaRef.id, "estoque"), {
          tipo: "entrada",
          m2,
          obs: "Entrada inicial",
          userId: user.uid,
          criadoEm: new Date(),
        });

        const saldoDocRef = doc(db, "rochas", rochaRef.id, "resumo", "saldo");
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(saldoDocRef);
          const atual = snap.exists() ? snap.data().m2 || 0 : 0;
          tx.set(saldoDocRef, { m2: atual + m2 }, { merge: true });
        });
      }

      setStatus("Rocha cadastrada com sucesso!");
      setStatusType("success");
      if (isAdmin) setEmpresaId("");
      setNome("");
      setTipo("");
      setAcabamento("");
      setEntradaInicial("");
      setImagem(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setStatus("Erro ao salvar rocha.");
      setStatusType("error");
    }

    setSalvando(false);
  };


  const handleImagemChange = (e) => {
    const file = e.target.files[0];
    setImagem(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  if (loading) return <div className="p-6 text-gray-700">Carregando...</div>;

  if (isEmpresa && !profile?.companyId) {
    return (
      <div className="p-6 text-red-700">
        Seu usuário não está vinculado a uma empresa.
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
        <h2 className="text-3xl font-semibold mb-6 text-gray-800 text-center">
          Cadastro de Rocha
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isAdmin ? (
            <select
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              required
              className="w-full p-3 rounded-lg border border-gray-300"
            >
              <option value="">Selecione a empresa</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nome}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={empresaNome || "Empresa não encontrada"}
              disabled
              className="w-full p-3 rounded-lg border border-gray-200 bg-gray-100"
            />
          )}

          <input
            className="w-full p-3 rounded-lg border border-gray-300"
            type="text"
            placeholder="Nome da rocha"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <input
            className="w-full p-3 rounded-lg border border-gray-300"
            type="text"
            placeholder="Tipo (granito, mármore...)"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            required
          />
          <input
            className="w-full p-3 rounded-lg border border-gray-300"
            type="text"
            placeholder="Acabamento (polido, bruto...)"
            value={acabamento}
            onChange={(e) => setAcabamento(e.target.value)}
            required
          />
          <input
            className="w-full p-3 rounded-lg border border-gray-300"
            type="number"
            min="0"
            step="0.01"
            placeholder="Entrada inicial (m²)"
            value={entradaInicial}
            onChange={(e) => setEntradaInicial(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImagemChange}
            className="w-full p-3 rounded-lg border border-gray-300 bg-white"
          />

          {previewUrl && (
            <img
              src={previewUrl}
              alt="Pré-visualização"
              className="w-full h-auto rounded-xl border border-gray-200"
            />
          )}

          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-black transition"
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </form>

        {status && (
          <p
            className={`mt-4 text-sm text-center ${statusType === "success"
                ? "text-green-600"
                : "text-red-600"
              }`}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
