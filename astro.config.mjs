import { defineConfig } from "astro/config";

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || "https://cerebralframe.com",
  trailingSlash: "never",
  build: {
    format: "directory",
    inlineStylesheets: "always",
  },
});
