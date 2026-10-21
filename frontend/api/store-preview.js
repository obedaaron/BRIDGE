import QRCode from "qrcode";

const apiBase = process.env.VITE_API_URL || process.env.BRIDGE_API_URL || "";
const esc = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\x27/g, "&#39;");
const safePhoto = (url) => /^https:\/\//i.test(String(url || "")) ? String(url) : "";

function svgCard(store, slug, origin, canonical) {
  const photo = safePhoto(store.storefront_cover_url || store.cover_image_url || store.gallery_image_url || store.listing_image_url);
  const logo = safePhoto(store.logo_url);
  const qr = QRCode.create(canonical, { errorCorrectionLevel: "M" }).modules;
  const cell = 4;
  const quiet = 4;
  const qrSize = qr.size + quiet * 2;
  let qrRects = "";
  for (let y = 0; y < qr.size; y += 1) for (let x = 0; x < qr.size; x += 1) {
    if (qr.get(x, y)) qrRects += `<rect x="${(x + quiet) * cell}" y="${(y + quiet) * cell}" width="${cell}" height="${cell}"/>`;
  }
  const name = String(store.business_name || "Local store").slice(0, 45);
  const description = String(store.description || "Discover this local business on BRIDGE").replace(/\s+/g, " ").slice(0, 90);
  const place = [store.city, store.state].filter(Boolean).join(", ") || "Nigeria";
  const category = String(store.category_name || "LOCAL BUSINESS").slice(0, 34).toUpperCase();
  const photoLayer = photo ? `<image href="${esc(photo)}" x="700" y="0" width="500" height="630" preserveAspectRatio="xMidYMid slice"/><rect x="570" width="630" height="630" fill="url(#veil)"/>` : `<circle cx="990" cy="290" r="240" fill="#9db69e" opacity=".16"/>`;
  const mark = logo ? `<image href="${esc(logo)}" x="76" y="156" width="92" height="92" preserveAspectRatio="xMidYMid slice" clip-path="url(#logo)"/>` : `<text x="122" y="216" text-anchor="middle" fill="#f4f0e6" font-family="Arial,sans-serif" font-size="42" font-weight="700">${esc(name.slice(0, 1).toUpperCase())}</text>`;
  const qrX = 76;
  const qrY = 496;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#2c4337"/><stop offset="1" stop-color="#101915"/></linearGradient><linearGradient id="veil"><stop stop-color="#101915"/><stop offset=".72" stop-color="#101915" stop-opacity=".9"/><stop offset="1" stop-color="#101915" stop-opacity=".1"/></linearGradient><clipPath id="logo"><rect x="76" y="156" width="92" height="92" rx="26"/></clipPath></defs><rect width="1200" height="630" fill="url(#bg)"/>${photoLayer}<image href="${esc(origin)}/logo.png" x="76" y="54" width="30" height="30"/><text x="120" y="77" fill="#e7eee6" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="5">BRIDGE · LOCAL, CONNECTED</text><rect x="76" y="156" width="92" height="92" rx="26" fill="#496653"/>${mark}<text x="190" y="180" fill="#c9b783" font-family="Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="2">${esc(category)}</text><text x="76" y="328" fill="#f4f0e6" font-family="Arial,sans-serif" font-size="54" font-weight="700">${esc(name)}</text><text x="76" y="378" fill="#d5dfd5" font-family="Arial,sans-serif" font-size="24">${esc(place)}</text><text x="76" y="428" fill="#d5dfd5" font-family="Arial,sans-serif" font-size="20">${esc(description)}</text><rect x="${qrX}" y="${qrY}" width="${qrSize * cell + 16}" height="${qrSize * cell + 16}" rx="12" fill="#fff"/><g transform="translate(${qrX + 8},${qrY + 8})" fill="#17241c">${qrRects}</g><text x="${qrX + qrSize * cell + 34}" y="${qrY + 48}" fill="#e7eee6" font-family="Arial,sans-serif" font-size="18" font-weight="700">SCAN TO OPEN STORE</text><text x="1120" y="600" text-anchor="end" fill="#e7eee6" opacity=".8" font-family="Arial,sans-serif" font-size="15">bridge.com/store/${esc(slug)}</text></svg>`;
}

export default async function handler(req, res) {
  const slug = String(req.query.slug || "").replace(/[^a-z0-9-]/gi, "");
  if (!slug || !apiBase) return res.status(400).send("Store preview unavailable");
  try {
    const response = await fetch(`${apiBase.replace(/\/$/, "")}/store/${encodeURIComponent(slug)}/share-preview`);
    if (!response.ok) return res.status(response.status).send("Store not found");
    const { store } = await response.json();
    const origin = `https://${req.headers.host}`;
    const canonical = `${origin}/store/${encodeURIComponent(slug)}`;
    const title = `${store.business_name} | BRIDGE`;
    const description = [store.category_name, [store.city, store.state].filter(Boolean).join(", "), store.description].filter(Boolean).join(" · ").slice(0, 220);
    const image = `${origin}/api/store-preview?slug=${encodeURIComponent(slug)}&image=1`;
    if (req.query.image === "1") {
      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
      return res.status(200).send(svgCard(store, slug, origin, canonical));
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    return res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="website"><meta property="og:site_name" content="BRIDGE"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(image)}"><meta property="og:image:type" content="image/svg+xml"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(image)}"></head><body><a href="${esc(canonical)}">Open ${esc(store.business_name)} on BRIDGE</a></body></html>`);
  } catch (error) { console.error("Store preview failed", error); return res.status(502).send("Could not load this store preview"); }
}
