// src/components/Pages/Home.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const isEmpresa = profile?.role === "empresa";

  // Avisos (carrossel simples)
  const [avisos, setAvisos] = useState([]);
  const [slide, setSlide] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const sliderRef = useRef(null);

  // Vagas e empresas
  const [vagas, setVagas] = useState([]);
  const [empresasMap, setEmpresasMap] = useState({}); // {empresaId: nome}
  const [empresasSelect, setEmpresasSelect] = useState([]); // [{id, nome}]
  const [loading, setLoading] = useState(true);

  // Modal vaga
  const [openVaga, setOpenVaga] = useState(false);
  const [savingVaga, setSavingVaga] = useState(false);
  const [statusVaga, setStatusVaga] = useState("");
  const [formVaga, setFormVaga] = useState({
    empresaId: "",
    cargo: "",
    descricao: "",
    contatoEmail: "",
  });

  const podePublicarVaga = useMemo(
    () => !!user && (isAdmin || isEmpresa),
    [user, isAdmin, isEmpresa]
  );

  // util: carrega empresas em 'empresas' (plural). Se quiser, pode manter o fallback para 'empresa' (singular).
  const loadEmpresas = async () => {
    const snap = await getDocs(collection(db, "empresas"));
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
    const map = {};
    list.forEach((e) => (map[e.id] = e.nome || e.id));
    return { map, list: list.map((e) => ({ id: e.id, nome: e.nome || e.id })) };
  };

  // Carregar avisos, empresas e vagas
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Avisos (se existir a coleção)
        try {
          const avisosSnap = await getDocs(
            query(collection(db, "avisos"), orderBy("publicadoEm", "desc"))
          );
          setAvisos(avisosSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) })));
        } catch {
          setAvisos([]); // se a coleção não existir ainda, segue vazio
        }

        // Empresas
        const { map, list } = await loadEmpresas();
        setEmpresasMap(map);
        setEmpresasSelect(list);

        // Vagas ativas
        try {
          const vagasSnap = await getDocs(
            query(
              collection(db, "vagas"),
              where("ativa", "==", true),
              orderBy("publicadaEm", "desc")
            )
          );
          setVagas(vagasSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) })));
        } catch {
          setVagas([]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Autoplay carrossel
  useEffect(() => {
    if (!avisos.length || isHover) return;
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % avisos.length);
      if (sliderRef.current) {
        sliderRef.current.scrollTo({
          left: sliderRef.current.clientWidth * ((slide + 1) % avisos.length),
          behavior: "smooth",
        });
      }
    }, 6000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avisos.length, isHover, slide]);

  // Modal
  const abrirModalVaga = () => {
    setFormVaga({
      empresaId: isEmpresa ? profile?.companyId || "" : "",
      cargo: "",
      descricao: "",
      contatoEmail: "",
    });
    setStatusVaga("");
    setOpenVaga(true);
  };

  const fecharModalVaga = () => {
    setOpenVaga(false);
    setFormVaga({
      empresaId: "",
      cargo: "",
      descricao: "",
      contatoEmail: "",
    });
    setStatusVaga("");
  };

  // Salvar vaga
  const salvarVaga = async (e) => {
    e.preventDefault();
    setSavingVaga(true);
    setStatusVaga("");

    try {
      const finalEmpresaId = isEmpresa ? profile?.companyId : formVaga.empresaId;

      if (!finalEmpresaId) {
        setStatusVaga("Empresa não identificada.");
        setSavingVaga(false);
        return;
      }
      if (!formVaga.cargo || !formVaga.descricao || !formVaga.contatoEmail) {
        setStatusVaga("Preencha Cargo, Descrição e Email.");
        setSavingVaga(false);
        return;
      }

      await addDoc(collection(db, "vagas"), {
        empresaId: finalEmpresaId,
        cargo: formVaga.cargo,
        descricao: formVaga.descricao,
        contatoEmail: formVaga.contatoEmail,
        ativa: true,
        publicadaEm: new Date(),
      });

      setVagas((prev) => [
        {
          id: "temp_" + Math.random(),
          empresaId: finalEmpresaId,
          cargo: formVaga.cargo,
          descricao: formVaga.descricao,
          contatoEmail: formVaga.contatoEmail,
          ativa: true,
          publicadaEm: new Date(),
        },
        ...prev,
      ]);

      setStatusVaga("Vaga publicada!");
      setTimeout(() => fecharModalVaga(), 700);
    } catch (err) {
      setStatusVaga("Erro ao salvar vaga. Verifique as permissões.");
    } finally {
      setSavingVaga(false);
    }
  };

  // Pode deletar vaga?
  const canDelete = (vaga) =>
    isAdmin || (isEmpresa && vaga.empresaId === profile?.companyId);

  // Excluir vaga
  const excluirVaga = async (vagaId) => {
    const ok = window.confirm("Tem certeza que deseja excluir esta vaga?");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "vagas", vagaId));
      setVagas((prev) => prev.filter((v) => v.id !== vagaId));
    } catch (err) {
      alert("Não foi possível excluir a vaga. Verifique as permissões.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-50">
      {/* Intro */}
      <section className="max-w-6xl mx-auto px-4 pt-10">
        <div className="bg-white rounded-xl shadow p-8">
          <h1 className="text-3xl font-semibold text-center text-gray-900">
            Bem-vindo ao Granito App
          </h1>
          <p className="mt-3 text-center text-gray-600">
            Encontre rochas, acompanhe avisos e confira oportunidades de emprego.
          </p>
        </div>
      </section>

      {/* Carrossel de avisos */}
      <section className="max-w-6xl mx-auto px-4 pt-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Avisos</h2>
          {avisos.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              Nenhum aviso publicado.
            </p>
          ) : (
            <div
              ref={sliderRef}
              className="overflow-hidden relative"
              onMouseEnter={() => setIsHover(true)}
              onMouseLeave={() => setIsHover(false)}
            >
              <div className="flex transition-all">
                {avisos.map((a, idx) => (
                  <div
                    key={a.id}
                    className={`min-w-full px-6 py-8 text-center rounded-lg ${
                      idx === slide ? "block" : "hidden"
                    }`}
                  >
                    <h3 className="text-xl font-bold text-gray-800">
                      {a.titulo || "Sem título"}
                    </h3>
                    <p className="mt-2 text-gray-600">{a.mensagem || ""}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Vagas */}
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-12">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Vagas</h2>
            {podePublicarVaga && (
              <button
                onClick={abrirModalVaga}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black"
              >
                Nova vaga
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-6">Carregando vagas...</p>
          ) : vagas.length === 0 ? (
            <p className="text-center text-gray-500 py-6">Nenhuma vaga publicada.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {vagas.map((v) => (
                <div
                  key={v.id}
                  className="border rounded-lg p-5 shadow-sm hover:shadow-md transition relative"
                >
                  {/* Botão excluir (só admin/empresa dona) */}
                  {canDelete(v) && (
                    <button
                      onClick={() => excluirVaga(v.id)}
                      title="Excluir vaga"
                      className="absolute right-3 top-3 w-8 h-8 grid place-items-center rounded-full border hover:bg-gray-50"
                    >
                      {/* Ícone lixeira */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  )}

                  <h3 className="text-lg font-bold pr-10">{v.cargo}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {empresasMap[v.empresaId] || "Empresa"}
                  </p>
                  <p className="text-gray-700">{v.descricao}</p>
                  <p className="text-sm text-gray-600 mt-3">
                    Contato:{" "}
                    <a
                      href={`mailto:${v.contatoEmail}`}
                      className="underline text-gray-800"
                    >
                      {v.contatoEmail}
                    </a>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal - Nova vaga */}
      {openVaga && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Criar vaga</h3>
              <button onClick={fecharModalVaga} className="text-xl" aria-label="Fechar">
                ✕
              </button>
            </div>
            <form onSubmit={salvarVaga} className="space-y-4">
              {isAdmin && (
                <select
                  required
                  value={formVaga.empresaId}
                  onChange={(e) =>
                    setFormVaga((f) => ({ ...f, empresaId: e.target.value }))
                  }
                  className="w-full border p-2 rounded-lg"
                >
                  <option value="">Selecione a empresa</option>
                  {empresasSelect.length === 0 ? (
                    <option value="" disabled>
                      Nenhuma empresa encontrada
                    </option>
                  ) : (
                    empresasSelect.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nome}
                      </option>
                    ))
                  )}
                </select>
              )}

              {isEmpresa && (
                <input
                  disabled
                  value={empresasMap[profile?.companyId] || "Minha empresa"}
                  className="w-full p-3 rounded-lg border border-gray-200 bg-gray-100"
                />
              )}

              <input
                required
                type="text"
                placeholder="Cargo"
                value={formVaga.cargo}
                onChange={(e) =>
                  setFormVaga((f) => ({ ...f, cargo: e.target.value }))
                }
                className="w-full border p-2 rounded-lg"
              />

              <textarea
                required
                placeholder="Descrição"
                value={formVaga.descricao}
                onChange={(e) =>
                  setFormVaga((f) => ({ ...f, descricao: e.target.value }))
                }
                rows={4}
                className="w-full border p-2 rounded-lg"
              />

              <input
                required
                type="email"
                placeholder="Email para contato"
                value={formVaga.contatoEmail}
                onChange={(e) =>
                  setFormVaga((f) => ({ ...f, contatoEmail: e.target.value }))
                }
                className="w-full border p-2 rounded-lg"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={fecharModalVaga}
                  className="px-4 py-2 rounded-lg border"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingVaga}
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black disabled:opacity-50"
                >
                  {savingVaga ? "Salvando..." : "Salvar"}
                </button>
              </div>
              {statusVaga && (
                <p className="text-center text-sm text-gray-700">{statusVaga}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
