import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://everywordgames.com",
  output: "static",
  integrations: [
    sitemap({
      serialize(item) {
        // Games pages get weekly changefreq, everything else daily
        item.changefreq = item.url.includes("/games/") ? "weekly" : "daily";
        item.priority = item.url.endsWith(".com/") ? 1.0 : 0.7;
        item.lastmod = new Date().toISOString();
        return item;
      },
    }),
  ],
});
