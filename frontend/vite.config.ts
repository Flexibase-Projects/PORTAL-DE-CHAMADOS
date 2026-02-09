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
    plugins: [react(), tailwindcss()],
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
    },
  };
});
