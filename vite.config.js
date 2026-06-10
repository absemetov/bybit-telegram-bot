import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "src/web/client",

  resolve: {
    alias: {
      "@": resolve(__dirname, "src/web/client"),
      "@js": resolve(__dirname, "src/web/client/js"),
      "@core": resolve(__dirname, "src/web/client/js/core"),
      "@modules": resolve(__dirname, "src/web/client/js/modules"),
      "@templates": resolve(__dirname, "src/web/client/templates"),
      "@styles": resolve(__dirname, "src/web/client/styles"),
    },
  },

  server: {
    port: 3000,
    allowedHosts: true,
    // Проксирование API-запросов к бэкенду
    proxy: {
      "/api": {
        target: "http://localhost:3003",
        changeOrigin: true,
      },
    },
  },

  preview: {
    port: 4173,
    allowedHosts: true,
  },

  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: { main: resolve(__dirname, "src/web/client/index.html") },
      output: {
        entryFileNames: "js/[name].[hash].js",
        chunkFileNames: "js/[name].[hash].js",
        assetFileNames: (info) => {
          if (info.name?.endsWith(".css")) return "css/[name].[hash].[ext]";
          if (/\.(png|jpe?g|gif|svg)$/.test(info.name))
            return "img/[name].[hash].[ext]";
          return "assets/[name].[hash].[ext]";
        },
      },
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ["color-functions", "global-builtin", "import"],
        quietDeps: true,
      },
    },
  },
});
