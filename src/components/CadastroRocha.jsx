// src/components/CadastroRocha.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { db, storage } from "../firebase";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  updateDoc,
  increment,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../components/context/AuthContext";

export default function CadastroRocha() {
  const { user, profile, loading } = useAuth();
  const isAdmin = profile?.role === "admin";
  const isEmpresa = profile?.role === "empresa";

  // --------- STATE ----------
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
  const [statusType, setStatusType] = useState(""); // "success" | "error" | ""
  const [salvando, setSalvando] = useState(false);

  const [rochasExistentes, setRochasExistentes] = useState([]);
  const [usarRochaExistente, setUsarRochaExistente] = useState(""); // opcional
  const [checandoDuplicata, setChecandoDuplicata] = useState(false);
  const [existeDuplicata, setExisteDuplicata] = useState(false);

  const debounceTimer = useRef(null);

  // --------- HELPERS ----------
  const normalize = (s) => (s || "").trim().toLowerCase();
  const finalEmpresaId = useMemo(
    () => (isEmpresa ? profile?.companyId : empresaId),
    [isEmpresa, profile?.companyId, empresaId]
  );

  // --------- LOAD EMPRESAS ----------
  useEffect(() => {
    if (loading) return;

    const loadEmpresas = async () => {
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

    loadEmpresas();
  }, [loading, isAdmin, isEmpresa, profile]);

  // --------- CHECAGEM DE DUPLICATA (apenas pelo nome) COM DEBOUNCE ----------
  useEffect(() => {
    // limpa resultados quando nome muda
    setRochasExistentes([]);
    setUsarRochaExistente("");
    setExisteDuplicata(false);

    if (!finalEmpresaId) return;

    // só consulta se tiver ao menos 2 chars (evita ruído)
    const nomeNorm = normalize(nome);
    if (nomeNorm.length < 2) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      return;
    }

    setChecandoDuplicata(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const qDup = query(
          collection(db, "rochas"),
          where("empresaId", "==", finalEmpresaId),
          where("nome", "==", nomeNorm)
        );
        const snap = await getDocs(qDup);
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setRochasExistentes(list);
          setExisteDuplicata(true);
        } else {
          setRochasExistentes([]);
          setExisteDuplicata(false);
        }
      } catch (err) {
        console.error("Erro ao verificar duplicata:", err);
        // não trata como erro fatal; apenas desliga o indicador
      } finally {
        setChecandoDuplicata(false);
      }
    }, 350); // 350ms de debounce

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [nome, finalEmpresaId]);

  // --------- SUBMIT ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setStatusType("");
    setSalvando(true);

    try {
      // valida empresa
      if (!finalEmpresaId) {
        setStatus("Selecione a empresa (ou verifique seu vínculo).");
        setStatusType("error");
        setSalvando(false);
        return;
      }

      const nomeNorm = normalize(nome);
      const tipoNorm = normalize(tipo);
      const acabamentoNorm = normalize(acabamento);
      const m2 = Number(entradaInicial || 0);

      // checagem final de duplicata (servidor) — apenas por nome
      try {
        const qDup = query(
          collection(db, "rochas"),
          where("empresaId", "==", finalEmpresaId),
          where("nome", "==", nomeNorm)
        );
        const snap = await getDocs(qDup);

        // Se existe e usuário não escolheu usar a existente, bloqueia o cadastro
        if (!snap.empty && !usarRochaExistente) {
          setStatus("⚠️ Já existe uma rocha com esse nome nessa empresa.");
          setStatusType("error");
          setSalvando(false);
          return;
        }
      } catch (verr) {
        console.error("Erro ao validar duplicata no submit:", verr);
        setStatus("Erro ao validar duplicata.");
        setStatusType("error");
        setSalvando(false);
        return;
      }

      // UPLOAD DE IMAGEM (opcional)
      let fotoUrl = "";
      if (imagem) {
        try {
          const safeName = imagem.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "_");
          const imageRef = ref(storage, `rochas/${Date.now()}_${safeName}`);
          const snapImg = await uploadBytes(imageRef, imagem);
          fotoUrl = await getDownloadURL(snapImg.ref);
        } catch (upErr) {
          console.error("Erro no upload de imagem:", upErr);
          setStatus("Erro ao enviar a imagem. Tente novamente.");
          setStatusType("error");
          setSalvando(false);
          return;
        }
      }

      // BRANCH 1: usar rocha existente → apenas incrementa estoqueM2 e registra movimentação
      if (usarRochaExistente) {
        try {
          if (m2 > 0) {
            const rochaDocRef = doc(db, "rochas", usarRochaExistente);
            await updateDoc(rochaDocRef, {
              estoqueM2: increment(m2),
            });

            if (user?.uid) {
              await addDoc(
                collection(db, "rochas", usarRochaExistente, "estoque"),
                {
                  tipo: "entrada",
                  m2,
                  obs: "Entrada adicional pelo cadastro",
                  userId: user.uid,
                  criadoEm: new Date(),
                }
              );
            }
          }

          setStatus("Estoque atualizado na rocha existente!");
          setStatusType("success");
        } catch (updErr) {
          console.error("Erro ao atualizar rocha existente:", updErr);
          setStatus("Rocha existente encontrada, mas falhou ao atualizar estoque.");
          setStatusType("error");
        } finally {
          setSalvando(false);
        }

        // limpa campos e sai
        if (isAdmin) setEmpresaId("");
        setNome("");
        setTipo("");
        setAcabamento("");
        setEntradaInicial("");
        setImagem(null);
        setPreviewUrl(null);
        setUsarRochaExistente("");
        setRochasExistentes([]);
        setExisteDuplicata(false);
        return;
      }

      // BRANCH 2: criar nova rocha
      let novaRochaRef = null;
      try {
        novaRochaRef = await addDoc(collection(db, "rochas"), {
          empresaId: finalEmpresaId,
          nome: nomeNorm,
          tipo: tipoNorm,
          acabamento: acabamentoNorm,
          fotoUrl,
          estoqueM2: m2,
          criadoEm: new Date(),
        });
      } catch (createErr) {
        console.error("Erro ao criar rocha:", createErr);
        setStatus("Erro ao salvar rocha.");
        setStatusType("error");
        setSalvando(false);
        return;
      }

      // registra movimentação de entrada inicial (não é obrigatório para salvar a rocha)
      if (m2 > 0 && user?.uid && novaRochaRef?.id) {
        try {
          await addDoc(
            collection(db, "rochas", novaRochaRef.id, "movimentacoes"),
            {
              tipo: "entrada",
              m2,
              obs: "Entrada inicial",
              userId: user.uid,
              criadoEm: new Date(),
            }
          );
        } catch (movErr) {
          console.error("Rocha criada, mas falhou ao salvar movimentação:", movErr);
          // Não marca como erro fatal, apenas avisa
          setStatus("Rocha criada. Atenção: falhou ao salvar a movimentação inicial.");
          setStatusType("error");
          setSalvando(false);
          // mesmo assim limpa campos
          if (isAdmin) setEmpresaId("");
          setNome("");
          setTipo("");
          setAcabamento("");
          setEntradaInicial("");
          setImagem(null);
          setPreviewUrl(null);
          setRochasExistentes([]);
          setExisteDuplicata(false);
          setUsarRochaExistente("");
          return;
        }
      }

      // sucesso total
      setStatus("Rocha cadastrada com sucesso!");
      setStatusType("success");

      // Limpar campos
      if (isAdmin) setEmpresaId("");
      setNome("");
      setTipo("");
      setAcabamento("");
      setEntradaInicial("");
      setImagem(null);
      setPreviewUrl(null);
      setRochasExistentes([]);
      setExisteDuplicata(false);
      setUsarRochaExistente("");
      setSalvando(false);
    } catch (err) {
      console.error("Erro inesperado:", err);
      setStatus("Erro inesperado ao salvar rocha.");
      setStatusType("error");
      setSalvando(false);
    }
  };

  // --------- IMG PREVIEW ----------
  const handleImagemChange = (e) => {
    const file = e.target.files[0];
    setImagem(file || null);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  // --------- RENDER ----------
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

        {/* Aviso de duplicata em tempo real */}
        {finalEmpresaId && nome && (
          <div
            className={`mb-4 text-sm text-center ${
              existeDuplicata ? "text-yellow-700" : "text-gray-500"
            }`}
          >
            {checandoDuplicata
              ? "Verificando nome..."
              : existeDuplicata
              ? "⚠️ Já existe uma rocha com esse nome nesta empresa."
              : "Nome disponível."}
          </div>
        )}

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

          {/* Se existir duplicata, permite selecionar a existente
              (se você preferir apenas bloquear, pode remover este bloco) */}
          {existeDuplicata && rochasExistentes.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm text-gray-700">
                Já existe uma rocha com esse nome. Você pode criar uma nova mesmo
                assim (bloqueado por padrão) ou selecionar a rocha existente para
                adicionar estoque:
              </label>
              <select
                className="w-full p-3 rounded-lg border border-yellow-400 bg-yellow-50"
                value={usarRochaExistente}
                onChange={(e) => setUsarRochaExistente(e.target.value)}
              >
                <option value="">(Criar nova rocha está bloqueado)</option>
                {rochasExistentes.map((r) => (
                  <option key={r.id} value={r.id}>
                    Usar existente: {r.nome}  • estoque:{" "}
                    {typeof r.estoqueM2 === "number" ? r.estoqueM2 : 0} m²
                  </option>
                ))}
              </select>
            </div>
          )}

          <input
            className="w-full p-3 rounded-lg border border-gray-300"
            type="number"
            min="0"
            step="0.01"
            placeholder="Entrada inicial (m²)"
            value={entradaInicial}
            onChange={(e) => setEntradaInicial(e.target.value)}
            required
          />

          {/* Upload de imagem só quando não for usar existente */}
          {!usarRochaExistente && (
            <input
              type="file"
              accept="image/*"
              onChange={handleImagemChange}
              className="w-full p-3 rounded-lg border border-gray-300 bg-white"
            />
          )}

          {previewUrl && !usarRochaExistente && (
            <img
              src={previewUrl}
              alt="Pré-visualização"
              className="w-full h-auto rounded-xl border border-gray-200"
            />
          )}

          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-black transition disabled:opacity-60"
            disabled={
              salvando ||
              checandoDuplicata ||
              (!!existeDuplicata && !usarRochaExistente) // bloqueia criar nova se já existe e não selecionou usar existente
            }
            title={
              !!existeDuplicata && !usarRochaExistente
                ? "Já existe uma rocha com esse nome. Selecione a existente para adicionar estoque."
                : ""
            }
          >
            {salvando ? "Salvando..." : usarRochaExistente ? "Adicionar ao estoque" : "Salvar"}
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
