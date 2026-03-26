import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const envDir = path.resolve(__dirname, "..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, "");
  const port = parseInt(process.env.PORT || env.PORT || "3001", 10);
  const backendPort = parseInt(process.env.BACKEND_PORT || env.BACKEND_PORT || "3002", 10);

  return {
    envDir,
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "log-api-proxy",
        configureServer() {
          console.info(
            `\n[vite] Proxy /api -> http://127.0.0.1:${backendPort}\n` +
              `    Se aparecer 500 nas chamadas /api, suba o backend (ex.: na raiz do repo: npm run dev).\n`
          );
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port,
      host: true,
      proxy: {
        "/api": {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react-router")) return "vendor-router";
              if (
                /[\\/]node_modules[\\/]react[\\/]/.test(id) ||
                /[\\/]node_modules[\\/]react-dom[\\/]/.test(id) ||
                /[\\/]node_modules[\\/]scheduler[\\/]/.test(id)
              ) {
                return "vendor-react";
              }
              if (id.includes("@mui")) return "vendor-mui";
              if (id.includes("recharts")) return "vendor-recharts";
              if (id.includes("lucide-react")) return "vendor-lucide";
              if (id.includes("axios")) return "vendor-axios";
              return "vendor";
            }
          },
        },
      },
    },
  };
});
