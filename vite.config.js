import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/ConnectStone-main/" : "/",
  // Compatibilidade temporária com o .env.local antigo durante a migração.
  envPrefix: ["VITE_", "REACT_APP_"],
  test: {
    include: ["tests/**/*.test.js"],
  },
}));
