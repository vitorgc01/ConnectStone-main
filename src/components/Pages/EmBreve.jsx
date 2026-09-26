import { Link, useLocation } from "react-router-dom";
import fundoImage from "../../img/fundo.png";

const nomes = {
  "/servicos": "Serviços",
  "/arquitetos": "Arquitetos",
  "/construtoras": "Construtoras",
  "/transportadores": "Transportadores",
};

export default function EmBreve() {
  const { pathname } = useLocation();
  const nome = nomes[pathname] || "Esta área";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "7rem 1.5rem 3rem",
        color: "white",
        textAlign: "center",
        backgroundImage: `linear-gradient(rgba(0,0,0,.82), rgba(0,0,0,.92)), url(${fundoImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <section style={{ maxWidth: "36rem" }}>
        <p style={{ color: "#C9A96E", letterSpacing: ".25em", textTransform: "uppercase", fontSize: ".7rem" }}>
          Em desenvolvimento
        </p>
        <h1 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "clamp(2rem, 7vw, 3.5rem)", margin: ".75rem 0 1rem" }}>
          {nome}
        </h1>
        <p style={{ color: "rgba(255,255,255,.6)", lineHeight: 1.7 }}>
          Estamos preparando este catálogo. Enquanto isso, você pode consultar as empresas e rochas já disponíveis.
        </p>
        <Link
          to="/empresas"
          style={{ display: "inline-block", marginTop: "2rem", padding: ".85rem 1.25rem", borderRadius: ".65rem", background: "#C9A96E", color: "#0A0A0A", fontWeight: 700, textDecoration: "none" }}
        >
          Ver empresas
        </Link>
      </section>
    </main>
  );
}
