import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Sin prefijo VITE_: el destino del proxy solo lo usa el servidor de
  // desarrollo y no debe incrustarse en el bundle.
  const entorno = loadEnv(mode, process.cwd(), "")
  const destinoApi = entorno.SOEM_API_DESTINO ?? "http://localhost:8080"

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      proxy: {
        // El navegador siempre llama a /api/v1 (mismo origen) y el proxy lo
        // reescribe al context root de soem.war. Así coincide el
        // path=/api/v1/auth de la cookie del refresh token.
        "/api": {
          target: destinoApi,
          changeOrigin: true,
          rewrite: (ruta) => ruta.replace(/^\/api/, "/soem/api"),
        },
      },
    },
  }
})
