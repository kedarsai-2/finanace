// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    build: {
      manifest: true,
      // Avoid collision with the app route "/assets" on static hosts (e.g. Vercel).
      // Vite default assets directory is "/assets", which can conflict on hard refresh.
      assetsDir: "_app",
    },
    server: {
      port: 5173,
      strictPort: false,
    },
  },
});
