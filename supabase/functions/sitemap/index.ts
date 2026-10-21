import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE = "https://flywaters.app";
const STATIC: [string, string, string][] = [
  ["/", "daily", "1.0"],
  ["/mappa", "daily", "0.9"],
  ["/blog", "weekly", "0.8"],
  ["/contatti", "monthly", "0.6"],
  ["/fly-fishing-guide-italy", "monthly", "0.7"],
  ["/fly-fishing-italy", "weekly", "0.9"],
];
const REGIONS = [
  "lombardia", "trentino-alto-adige", "friuli-venezia-giulia", "veneto", "piemonte",
  "emilia-romagna", "toscana", "umbria", "valle-d-aosta", "liguria",
];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const day = (d?: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : null);

function entry(path: string, freq: string, prio: string, lastmod?: string | null) {
  return `  <url><loc>${esc(BASE + path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>${freq}</changefreq><priority>${prio}</priority></url>`;
}

Deno.serve(async () => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const [blog, spots, profiles] = await Promise.all([
    sb.from("blog_posts").select("slug, updated_at, published_at").eq("status", "published").limit(5000),
    sb.from("spots").select("slug, updated_at").not("slug", "is", null).limit(10000),
    sb.from("profiles").select("username").not("username", "is", null).limit(20000),
  ]);

  const lines = [
    ...STATIC.map(([p, f, pr]) => entry(p, f, pr)),
    ...REGIONS.map((r) => entry(`/fly-fishing-italy/${r}`, "weekly", "0.7")),
    ...(blog.data ?? []).map((b) => entry(`/blog/${b.slug}`, "monthly", "0.7", day(b.updated_at || b.published_at))),
    ...(spots.data ?? []).map((s) => entry(`/spot/${s.slug}`, "weekly", "0.6", day(s.updated_at))),
    ...(profiles.data ?? []).map((p) => entry(`/@${encodeURIComponent(p.username!)}`, "weekly", "0.5")),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join("\n")}\n</urlset>\n`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
});
