import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import { resolve } from "path";
import manifest from "./manifest.config";

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    modulePreload: false,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        "auth-callback": resolve(__dirname, "auth-callback.html"),
      },
    },
  },
});

