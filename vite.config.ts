/// <reference types="vitest/config" />
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
    test: {
      environment: "jsdom",
      include: ["src/**/*.test.{ts,tsx}"],
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
          // El back-end emite la cookie con path=<contextPath>/api/v1/auth
          // (/soem/api/v1/auth); sin reescribirla el navegador no la envía
          // a /api/v1/auth y el refresh falla. La clave se compara con el
          // path completo (no es un prefijo). En Nginx:
          // proxy_cookie_path /soem/api/ /api/;
          cookiePathRewrite: { "/soem/api/v1/auth": "/api/v1/auth" },
        },
      },
    },
  }
})
