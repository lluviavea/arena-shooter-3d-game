import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  base: "/arena-shooter-3d-game/",
  publicDir: "public",
  server: {
    port: 5173,
    open: false,
  },
});
