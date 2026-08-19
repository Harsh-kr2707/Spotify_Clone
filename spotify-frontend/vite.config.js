import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://spotify-clone-uy2r.onrender.com",
        changeOrigin: true,
      },
    },
  },
});