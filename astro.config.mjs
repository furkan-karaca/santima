// @ts-check
import { defineConfig, fontProviders } from "astro/config";

// Fonts are downloaded at build time and served from our own host:
// no request to Google or any foreign CDN reaches the visitor's browser.
// A preview build sets SITE_ORIGIN and SITE_BASE (e.g. a GitHub Pages project
// page); production builds for the domain root.
export default defineConfig({
  site: process.env.SITE_ORIGIN || "https://santima.ru",
  base: process.env.SITE_BASE || "/",
  // A strict Content-Security-Policy <meta> with hashes for Astro's own inline
  // code: only this origin may run scripts, load fonts, images or data.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "base-uri 'none'",
        "object-src 'none'",
        "form-action 'none'",
      ],
    },
  },
  fonts: [
    {
      name: "Cormorant",
      cssVariable: "--font-display",
      provider: fontProviders.fontsource(),
      weights: [300, 400, 500],
      styles: ["normal", "italic"],
      subsets: ["latin", "cyrillic"],
      fallbacks: ["Georgia", "serif"],
    },
    {
      name: "Montserrat",
      cssVariable: "--font-body",
      provider: fontProviders.fontsource(),
      weights: [400, 500, 600],
      styles: ["normal"],
      subsets: ["latin", "cyrillic"],
      fallbacks: ["Arial", "sans-serif"],
    },
  ],
});
