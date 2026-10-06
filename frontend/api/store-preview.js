const apiBase = process.env.VITE_API_URL || process.env.BRIDGE_API_URL || "";
const esc = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\x27/g, "&#39;");
export default async function handler(req, res) {
  const slug = String(req.query.slug || "").replace(/[^a-z0-9-]/gi, "");
  if (!slug || !apiBase) return res.status(400).send("Store preview unavailable");
  try {
    const response = await fetch(`${apiBase.replace(/\/$/, "")}/store/${encodeURIComponent(slug)}/share-preview`);
    if (!response.ok) return res.status(response.status).send("Store not found");
    const { store } = await response.json();
    const title = `${store.business_name} | BRIDGE`;
    const description = [store.category_name, [store.city, store.state].filter(Boolean).join(", "), store.description].filter(Boolean).join(" · ").slice(0, 220);
    const origin = `https://${req.headers.host}`;
    const canonical = `${origin}/store/${encodeURIComponent(slug)}`;
    const image = store.storefront_cover_url || store.cover_image_url || store.logo_url || `${origin}/api/store-preview?slug=${encodeURIComponent(slug)}&image=1`;
    if (req.query.image === "1") {
      const cover = store.storefront_cover_url || store.cover_image_url;
      const art = cover ? `<image href="${esc(cover)}" x="700" y="0" width="500" height="630" preserveAspectRatio="xMidYMid slice"/>` : `<circle cx="990" cy="290" r="240" fill="#9db69e" opacity=".16"/>`;
      const mark = store.logo_url ? `<image href="${esc(store.logo_url)}" x="76" y="156" width="92" height="92" preserveAspectRatio="xMidYMid slice" clip-path="url(#logo)"/>` : `<text x="122" y="216" text-anchor="middle" fill="#f4f0e6" font-family="Arial,sans-serif" font-size="42" font-weight="700">${esc(store.business_name.slice(0,1))}</text>`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#2c4337"/><stop offset="1" stop-color="#101915"/></linearGradient><linearGradient id="veil"><stop stop-color="#101915"/><stop offset=".72" stop-color="#101915" stop-opacity=".9"/><stop offset="1" stop-color="#101915" stop-opacity=".1"/></linearGradient><clipPath id="logo"><rect x="76" y="156" width="92" height="92" rx="26"/></clipPath></defs><rect width="1200" height="630" fill="url(#bg)"/>${art}<rect width="1200" height="630" fill="url(#veil)"/><text x="76" y="90" fill="#e7eee6" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="5">BRIDGE · LOCAL, CONNECTED</text><rect x="76" y="156" width="92" height="92" rx="26" fill="#496653"/>${mark}<text x="190" y="180" fill="#c9b783" font-family="Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="2">${esc(store.category_name || "LOCAL BUSINESS").toUpperCase()}</text><text x="76" y="328" fill="#f4f0e6" font-family="Arial,sans-serif" font-size="54" font-weight="700">${esc(store.business_name)}</text><text x="76" y="378" fill="#d5dfd5" font-family="Arial,sans-serif" font-size="24">${esc([store.city,store.state].filter(Boolean).join(", ") || "Nigeria")}</text><text x="76" y="428" fill="#d5dfd5" font-family="Arial,sans-serif" font-size="20">${esc(String(store.description || "Discover this local business on BRIDGE").replace(/\s+/g," ").slice(0,92))}</text><rect x="76" y="514" width="250" height="56" rx="28" fill="#c9b783"/><text x="201" y="550" text-anchor="middle" fill="#17241c" font-family="Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="1">VISIT THIS STORE ↗</text><text x="1120" y="578" text-anchor="end" fill="#e7eee6" opacity=".75" font-family="Arial,sans-serif" font-size="15">bridge.com/store/${esc(slug)}</text></svg>`;
      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
      return res.status(200).send(svg);
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    return res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="website"><meta property="og:site_name" content="BRIDGE"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(image)}"></head><body><a href="${esc(canonical)}">Open ${esc(store.business_name)} on BRIDGE</a></body></html>`);
  } catch (error) { console.error("Store preview failed", error); return res.status(502).send("Could not load this store preview"); }
}