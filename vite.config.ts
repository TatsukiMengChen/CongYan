import { defineConfig } from "vite";
import React from "@vitejs/plugin-react-swc";
import UnoCSS from "unocss/vite";

const host = process.env.TAURI_DEV_HOST || "0.0.0.0";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [UnoCSS(), React()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 5173,
    strictPort: true,
    host: host || false,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
}));
