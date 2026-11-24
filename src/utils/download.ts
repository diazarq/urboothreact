/**
 * Utility unduh langsung (offline-safe) dan kompresi gambar sebelum upload.
 */

const MAX_DEFAULT_BYTES = 2 * 1024 * 1024 // ~2 MB

export function buildResultFilename(
  ext: 'png' | 'jpg' | 'webm' | 'gif' = 'png',
  prefix = 'urbooth'
): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${prefix}-${yyyy}-${mm}-${dd}-${hh}${min}.${ext}`
}

/**
 * Opsi A: Unduh langsung lewat Blob + <a download> + revokeObjectURL.
 * Tetap berjalan normal meskipun offline atau server upload bermasalah.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    anchor.rel = 'noopener'
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  } finally {
    // Beri jeda singkat agar browser sempat memulai proses download sebelum URL dibersihkan
    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl)
    }, 1500)
  }
}

/**
 * Konversi data URL (base64) ke Blob secara offline tanpa network fetch.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64Data] = dataUrl.split(',')
  const mimeMatch = header.match(/:(.*?);/)
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'
  const binary = atob(base64Data || '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

function loadBitmapFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal membaca gambar untuk dikompresi.'))
    }
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b)
        else reject(new Error('Gagal mengonversi gambar.'))
      },
      mimeType,
      quality
    )
  })
}

/**
 * Kompresi gambar sebelum upload agar ukuran maksimal ~2 MB.
 */
export async function compressImage(
  blob: Blob,
  maxBytes = MAX_DEFAULT_BYTES,
  maxDimension = 2000
): Promise<Blob> {
  if (blob.size <= maxBytes && blob.type === 'image/jpeg') {
    return blob
  }

  const img = await loadBitmapFromBlob(blob)
  let width = img.naturalWidth || img.width
  let height = img.naturalHeight || img.height

  if (Math.max(width, height) > maxDimension) {
    const scale = maxDimension / Math.max(width, height)
    width = Math.max(1, Math.round(width * scale))
    height = Math.max(1, Math.round(height * scale))
  }

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return blob

  const qualities = [0.9, 0.82, 0.74, 0.64, 0.52]
  let currentBlob: Blob = blob

  for (let pass = 0; pass < 3; pass++) {
    canvas.width = width
    canvas.height = height
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    for (const q of qualities) {
      currentBlob = await canvasToBlob(canvas, 'image/jpeg', q)
      if (currentBlob.size <= maxBytes) {
        return currentBlob
      }
    }

    // Jika masih > maxBytes, perkecil dimensi 20%
    width = Math.max(400, Math.round(width * 0.8))
    height = Math.max(400, Math.round(height * 0.8))
  }

  return currentBlob
}
