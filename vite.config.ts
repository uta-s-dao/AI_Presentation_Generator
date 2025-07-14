import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  test: {
    environment: "node",
    globals: true,
  },
  server: {
    host: "0.0.0.0", // ← 追加：コンテナ内でアクセス可能にする
    port: 3000, // ← 追加：ポートを3000に固定
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
