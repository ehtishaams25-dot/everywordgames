import { footerNav, games, siteNav } from "@/data/games";

export function GET() {
  const base = "https://everywordgames.com";
  const paths = [
    ...siteNav.map((item) => item.href),
    ...footerNav.map((item) => item.href),
    ...games.filter((game) => !game.comingSoon).map((game) => `/games/${game.slug}`)
  ];
  const urls = Array.from(new Set(paths)).map((path) => `
  <url>
    <loc>${base}${path}</loc>
    <changefreq>${path.includes("/games/") ? "weekly" : "daily"}</changefreq>
    <priority>${path === "/" ? "1.0" : "0.8"}</priority>
  </url>`);

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>`, {
    headers: { "Content-Type": "application/xml" }
  });
}
