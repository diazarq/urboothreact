/**
 * Serverless Function (Vercel) untuk Open Graph meta tag dinamis di /d/:id.
 * Karena Vite adalah SPA, crawler WhatsApp/LINE/Twitter tidak menjalankan JS.
 * Endpoint ini mendeteksi bot preview sosial media dan mengembalikan HTML
 * dengan og:image dari hasil foto Supabase Storage; sedangkan browser biasa
 * diarahkan ke aplikasi SPA (/index.html).
 */

interface ReqLike {
  query?: Record<string, string | string[] | undefined>
  headers?: Record<string, string | string[] | undefined>
}

interface ResLike {
  status: (code: number) => ResLike
  setHeader: (name: string, value: string) => void
  send: (body: string) => void
}

const BOT_UA_PATTERN =
  /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|discordbot|slackbot|line|linkedinbot|embedly/i

export default async function handler(req: ReqLike, res: ResLike) {
  const rawId = req.query?.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId || ''
  const userAgent = String(req.headers?.['user-agent'] || '')
  const host = String(req.headers?.host || 'urbooth.vercel.app')
  const origin = `https://${host}`

  const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
  const bucket = process.env.VITE_SUPABASE_BUCKET || 'urbooth-results'
  const safeId = /^[a-zA-Z0-9_-]{8,64}$/.test(id) ? id : ''

  const ogImage =
    supabaseUrl && safeId
      ? `${supabaseUrl}/storage/v1/object/public/${bucket}/results/${safeId}.jpg`
      : `${origin}/urbooth-logo.jpg`

  const pageUrl = `${origin}/d/${safeId}`

  // Untuk bot preview link (WhatsApp, Telegram, Twitter, dll): kirim HTML ringkas berisi OG tags
  if (BOT_UA_PATTERN.test(userAgent)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.status(200).send(`<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Hasil Foto URBOOTH</title>
  <meta name="description" content="Lihat dan unduh hasil foto photobooth URBOOTH kamu. Link berlaku 24 jam." />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="URBOOTH" />
  <meta property="og:title" content="Hasil Foto URBOOTH Kamu Siap Diunduh!" />
  <meta property="og:description" content="Buka link ini untuk melihat dan mengunduh strip foto & video photobooth URBOOTH. Berlaku 24 jam." />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Hasil Foto URBOOTH Kamu Siap Diunduh!" />
  <meta name="twitter:image" content="${ogImage}" />
</head>
<body>
  <p>Membuka hasil foto URBOOTH...</p>
</body>
</html>`)
    return
  }

  // Untuk browser pengguna biasa: muat index.html SPA agar React Router merender DownloadPage
  try {
    const htmlRes = await fetch(`${origin}/index.html`)
    const html = await htmlRes.text()
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(200).send(html)
  } catch {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(200).send(`<meta http-equiv="refresh" content="0;url=/#/d/${safeId}" />`)
  }
}
