// src/components/Pages/Home.jsx
import { useEffect, useRef, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import fundoImage from "../../img/fundo.png";
import logoBranca from "../../img/logoBranca.png"

export default function Home() {
  const { profile } = useAuth();

  // Avisos (carrossel simples)
  const [avisos, setAvisos] = useState([]);
  const [slide, setSlide] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const sliderRef = useRef(null);

  // Carregar avisos
  useEffect(() => {
    const load = async () => {
      try {
        const avisosSnap = await getDocs(
          query(collection(db, "avisos"), orderBy("publicadoEm", "desc"))
        );
        setAvisos(avisosSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) })));
      } catch {
        setAvisos([]);
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
  }, [avisos.length, isHover, slide]);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative pt-20" // pt-16 é padding-top (64px)
      style={{ backgroundImage: `url(${fundoImage})` }}
    >
      {/* Camada de blur acima do fundo */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/20 z-0" />
      <div className="relative z-10 pt-20 max-w-6xl mx-auto px-4 flex items-center justify-center min-h-[60vh]">
        <img
          src={logoBranca}
          alt="Logo Central"
          className="w-[800px] md:w-[800px] lg:w-[900px] transform translate-x-80 mt-40"
        />
        {/* Intro */}
        

        {/* Carrossel de avisos */}
        {/* <section className="pt-8 pb-12">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Avisos</h2>
            {avisos.length === 0 ? (
              <p className="text-gray-500 text-center py-6">Nenhum aviso publicado.</p>
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
        </section> */}
      </div>
    </div>
  );
}
