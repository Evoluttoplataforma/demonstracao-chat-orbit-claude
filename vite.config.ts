import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    cssCodeSplit: true,
    // Don't preload route-specific heavy chunks from the HTML entry.
    // Admin/DiagnosticoTab/SalasTab are only used in internal routes — preloading
    // them on every landing page destroys LCP for paid traffic.
    modulePreload: {
      resolveDependencies: (_filename, deps, { hostType }) => {
        if (hostType !== "html") return deps;
        const ROUTE_SPECIFIC = ["charts-", "Admin-", "DiagnosticoTab-", "SalasTab-"];
        return deps.filter((dep) => !ROUTE_SPECIFIC.some((p) => dep.includes(p)));
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-popover", "@radix-ui/react-tooltip", "@radix-ui/react-tabs"],
          supabase: ["@supabase/supabase-js"],
          // NOTE: recharts is intentionally NOT in manualChunks.
          // Letting Vite auto-split puts it inside the Admin lazy chunk,
          // so it's never downloaded on landing pages.
        },
      },
    },
  },
}));
