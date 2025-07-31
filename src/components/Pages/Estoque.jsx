// src/pages/Estoque.jsx  (ou src/components/Estoque.jsx)
import { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import {
    collection, getDocs, doc, getDoc, addDoc, runTransaction, query, where
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function Estoque() {
    const { user, profile } = useAuth();
    const isAdmin = profile?.role === "admin";
    const isEmpresa = profile?.role === "empresa";
    const companyId = profile?.companyId || null;

    const [rochas, setRochas] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [empresaFiltro, setEmpresaFiltro] = useState("");

    // Carrega empresas (para admin filtrar)
    useEffect(() => {
        if (!isAdmin) return;
        (async () => {
            const snap = await getDocs(collection(db, "empresas"));
            setEmpresas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        })();
    }, [isAdmin]);

    // Carrega rochas (admin: todas/filtradas; empresa: só da própria)
    useEffect(() => {
        (async () => {
            let rochasSnap;
            if (isAdmin && empresaFiltro) {
                const q = query(collection(db, "rochas"), where("empresaId", "==", empresaFiltro));
                rochasSnap = await getDocs(q);
            } else if (isAdmin) {
                rochasSnap = await getDocs(collection(db, "rochas"));
            } else if (isEmpresa && companyId) {
                const q = query(collection(db, "rochas"), where("empresaId", "==", companyId));
                rochasSnap = await getDocs(q);
            } else {
                setRochas([]);
                return;
            }

            const lista = await Promise.all(
                rochasSnap.docs.map(async (r) => {
                    const data = { id: r.id, ...r.data() };
                    // pega nome da empresa
                    let empresa = null;
                    const eSnap = await getDoc(doc(db, "empresas", data.empresaId));
                    if (eSnap.exists()) empresa = { id: eSnap.id, ...eSnap.data() };
                    // pega saldo atual
                    const sSnap = await getDoc(doc(db, "rochas", r.id, "resumo", "saldo"));
                    const saldo = sSnap.exists() ? (sSnap.data().m2 || 0) : 0;
                    return { ...data, empresa, saldo };
                })
            );
            setRochas(lista);
        })();
    }, [isAdmin, isEmpresa, companyId, empresaFiltro]);

    const podeMovimentar = useMemo(
        () => (isAdmin || isEmpresa) && !!user,
        [isAdmin, isEmpresa, user]
    );

    const movimentar = async (rochaId, tipo, m2, obs = "") => {
        const valor = Number(m2);
        if (!valor || valor <= 0) return;
        if (!user?.uid) return;

        const saldoDocRef = doc(db, "rochas", rochaId, "resumo", "saldo");
        const movimentosCol = collection(db, "rochas", rochaId, "estoque");

        // Atualiza saldo em transação e grava movimento
        await runTransaction(db, async (tx) => {
            const snapSaldo = await tx.get(saldoDocRef);
            const atual = snapSaldo.exists() ? (snapSaldo.data().m2 || 0) : 0;
            const novo = tipo === "entrada" ? atual + valor : atual - valor;
            if (novo < 0) {
                throw new Error("Saldo insuficiente para saída.");
            }
            tx.set(saldoDocRef, { m2: novo }, { merge: true });
        });

        await addDoc(movimentosCol, {
            tipo,
            m2: valor,
            obs,
            userId: user.uid,
            criadoEm: new Date(),
        });

        // Atualiza UI local (simples)
        setRochas(prev => prev.map(r => r.id === rochaId ? { ...r, saldo: tipo === "entrada" ? r.saldo + valor : r.saldo - valor } : r));
    };

    return (
        <div className="min-h-[calc(100vh-56px)] bg-gray-100 px-4 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">Controle de Estoque</h2>
                    {isAdmin && (
                        <select
                            className="p-2 border rounded"
                            value={empresaFiltro}
                            onChange={(e) => setEmpresaFiltro(e.target.value)}
                        >
                            <option value="">Todas as empresas</option>
                            {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                        </select>
                    )}
                </div>

                {rochas.length === 0 ? (
                    <p className="text-gray-600">Nenhuma rocha encontrada.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {rochas.map(r => (
                            <div key={r.id} className="bg-white rounded-xl shadow p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{r.nome}</h3>
                                        <p className="text-sm text-gray-600">{r.tipo} • {r.acabamento}</p>
                                        <p className="text-sm text-gray-600">Empresa: {r.empresa?.nome || "-"}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Saldo (m²)</p>
                                        <p className="text-2xl font-bold">{(r.saldo ?? 0).toFixed(2)}</p>
                                    </div>
                                </div>

                                {podeMovimentar && (
                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <MovForm
                                            label="Entrada"
                                            onSubmit={(m2, obs) => movimentar(r.id, "entrada", m2, obs)}
                                            buttonClass="bg-green-600 hover:bg-green-700"
                                        />
                                        <MovForm
                                            label="Saída"
                                            onSubmit={(m2, obs) => movimentar(r.id, "saida", m2, obs)}
                                            buttonClass="bg-red-600 hover:bg-red-700"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/** Formulário compacto para lançar movimento */
function MovForm({ label, onSubmit, buttonClass }) {
    const [m2, setM2] = useState("");
    const [obs, setObs] = useState("");
    const [err, setErr] = useState("");

    const handle = async (e) => {
        e.preventDefault();
        setErr("");
        try {
            if (!m2 || Number(m2) <= 0) {
                setErr("Informe um valor válido em m².");
                return;
            }
            await onSubmit(m2, obs);
            setM2(""); setObs("");
        } catch (e) {
            setErr(e.message || "Erro ao movimentar.");
        }
    };

    return (
        <form onSubmit={handle} className="border rounded-lg p-3">
            <p className="font-medium mb-2">{label}</p>
            <input
                type="number"
                min="0"
                step="0.01"
                placeholder="m²"
                value={m2}
                onChange={(e) => setM2(e.target.value)}
                className="w-full mb-2 p-2 border rounded"
            />
            <input
                type="text"
                placeholder="Observação (opcional)"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className="w-full mb-3 p-2 border rounded"
            />
            <button
                type="submit"
                className={`w-full text-white py-2 rounded ${buttonClass}`}
            >
                Lançar {label}
            </button>
            {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
        </form>
    );
}
