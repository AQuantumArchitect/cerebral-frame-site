import { defineConfig } from "astro/config";

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || "https://cerebralframe.com",
  trailingSlash: "never",
  // Keep scripts external so the production script-src 'self' policy permits them.
  vite: { build: { assetsInlineLimit: 0 } },
  build: {
    format: "directory",
    inlineStylesheets: "always",
  },
});
