// api/anime/animasu/[...path].js
//
// Proxy Vercel Serverless Function.
// Tugasnya: menerima request dari template LenzStream, meneruskannya ke API
// asli (sankavollerei.web.id), lalu mengembalikan hasilnya — sehingga URL
// API asli tidak pernah terlihat langsung oleh browser pengunjung.

const UPSTREAM_BASE = "https://www.sankavollerei.web.id/anime/animasu";

// GANTI dengan domain-domain yang boleh memanggil proxy ini.
// Tambahkan domain blogspot bawaan jika masih dipakai, mis:
// "https://lenzstream.blogspot.com"
const ALLOWED_ORIGINS = [
  "https://lenzstream.my.id",
  "https://www.lenzstream.my.id",
];

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { path = [] } = req.query;
  const subPath = Array.isArray(path) ? path.join("/") : String(path || "");

  const params = new URLSearchParams(req.query);
  params.delete("path");
  const qs = params.toString();

  const targetUrl = `${UPSTREAM_BASE}/${subPath}${qs ? `?${qs}` : ""}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "LenzStream-Proxy/1.0",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    const contentType = upstreamRes.headers.get("content-type") || "application/json";
    const body = await upstreamRes.text();

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    res.setHeader("Content-Type", contentType);
    res.status(upstreamRes.status).send(body);
  } catch (err) {
    res.status(502).json({
      error: "Gagal mengambil data dari upstream",
      detail: String(err && err.message ? err.message : err),
    });
  }
}
