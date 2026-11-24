import { compressImage } from '../utils/download'

export interface SharedResultManifest {
  id: string
  photoUrl: string
  videoUrl?: string
  createdAt: string
  expiresAt: string
  frameName?: string
}

export interface UploadResultOutput {
  id: string
  shareUrl: string
  expiresAt: string
  manifest: SharedResultManifest
  isLocalFallback: boolean
}

export type FetchSharedResultResponse =
  | { status: 'ok'; data: SharedResultManifest }
  | { status: 'expired'; expiresAt?: string }
  | { status: 'not_found' }
  | { status: 'error'; message: string }

const EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 jam
const MAX_UPLOAD_PHOTO_BYTES = 2.2 * 1024 * 1024 // ~2 MB batas toleransi
const LOCAL_CACHE_PREFIX = 'urbooth_shared_result_'

function getSupabaseConfig() {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, '') || ''
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || ''
  const bucket = (import.meta.env.VITE_SUPABASE_BUCKET as string | undefined) || 'urbooth-results'
  const customEndpoint =
    (import.meta.env.VITE_UPLOAD_ENDPOINT as string | undefined)?.replace(/\/+$/, '') || ''
  const publicBaseUrl =
    (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.replace(/\/+$/, '') ||
    window.location.origin

  return { url, anonKey, bucket, customEndpoint, publicBaseUrl }
}

function uploadViaXhr(
  url: string,
  body: Blob | string,
  headers: Record<string, string>,
  onProgress: (ratio: number) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url, true)

    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v))

    const onAbort = () => {
      xhr.abort()
      reject(new DOMException('Upload dibatalkan.', 'AbortError'))
    }

    if (signal) {
      if (signal.aborted) {
        onAbort()
        return
      }
      signal.addEventListener('abort', onAbort, { once: true })
    }

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onProgress(Math.min(1, ev.loaded / ev.total))
      }
    }

    xhr.onload = () => {
      signal?.removeEventListener('abort', onAbort)
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1)
        resolve()
      } else {
        reject(new Error(`Server menolak unggahan (HTTP ${xhr.status}).`))
      }
    }

    xhr.onerror = () => {
      signal?.removeEventListener('abort', onAbort)
      reject(new Error('Koneksi internet terputus saat mengunggah hasil foto.'))
    }

    xhr.send(body)
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Gagal membaca file lokal.'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Unggah hasil foto (+ video opsional) dengan nama acak crypto.randomUUID(),
 * kompresi <= 2 MB, progress bar, AbortController, dan masa berlaku 24 jam.
 */
export async function uploadSharedResult(params: {
  photoBlob: Blob
  videoBlob?: Blob | null
  frameName?: string
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}): Promise<UploadResultOutput> {
  const { photoBlob, videoBlob, frameName, onProgress, signal } = params

  if (signal?.aborted) {
    throw new DOMException('Upload dibatalkan.', 'AbortError')
  }

  onProgress?.(8)
  const compressedPhoto = await compressImage(photoBlob, 2 * 1024 * 1024)

  if (compressedPhoto.size > MAX_UPLOAD_PHOTO_BYTES) {
    throw new Error(
      'Ukuran file foto masih terlalu besar (> 2 MB) setelah kompresi. Silakan gunakan Unduh Langsung.'
    )
  }

  if (signal?.aborted) {
    throw new DOMException('Upload dibatalkan.', 'AbortError')
  }

  onProgress?.(20)
  const id = crypto.randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + EXPIRY_MS).toISOString()
  const cfg = getSupabaseConfig()

  // Mode 1: Upload ke Supabase Storage (Hanya pakai VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY publik)
  if (cfg.url && cfg.anonKey) {
    if (!navigator.onLine) {
      throw new Error('Tidak ada koneksi internet. Cek jaringanmu atau gunakan Unduh Langsung.')
    }

    const photoPath = `results/${id}.jpg`
    const photoEndpoint = `${cfg.url}/storage/v1/object/${cfg.bucket}/${photoPath}`
    const baseHeaders: Record<string, string> = {
      apikey: cfg.anonKey,
      'x-upsert': 'true',
      'cache-control': '86400',
    }
    if (!cfg.anonKey.startsWith('sb_publishable_')) {
      baseHeaders.Authorization = `Bearer ${cfg.anonKey}`
    }

    await uploadViaXhr(
      photoEndpoint,
      compressedPhoto,
      { ...baseHeaders, 'Content-Type': 'image/jpeg' },
      (ratio) => onProgress?.(Math.round(20 + ratio * (videoBlob ? 45 : 65))),
      signal
    )

    const photoPublicUrl = `${cfg.url}/storage/v1/object/public/${cfg.bucket}/${photoPath}`
    let videoPublicUrl: string | undefined

    if (videoBlob && videoBlob.size > 0 && videoBlob.size <= 15 * 1024 * 1024) {
      const videoPath = `results/${id}.webm`
      const videoEndpoint = `${cfg.url}/storage/v1/object/${cfg.bucket}/${videoPath}`
      await uploadViaXhr(
        videoEndpoint,
        videoBlob,
        { ...baseHeaders, 'Content-Type': videoBlob.type || 'video/webm' },
        (ratio) => onProgress?.(Math.round(65 + ratio * 25)),
        signal
      )
      videoPublicUrl = `${cfg.url}/storage/v1/object/public/${cfg.bucket}/${videoPath}`
    }

    const manifest: SharedResultManifest = {
      id,
      photoUrl: photoPublicUrl,
      videoUrl: videoPublicUrl,
      createdAt: now.toISOString(),
      expiresAt,
      frameName,
    }

    const metaPath = `meta/${id}.json`
    const metaEndpoint = `${cfg.url}/storage/v1/object/${cfg.bucket}/${metaPath}`
    await uploadViaXhr(
      metaEndpoint,
      JSON.stringify(manifest),
      { ...baseHeaders, 'Content-Type': 'application/json' },
      () => onProgress?.(100),
      signal
    )

    // Jika sedang di localhost/127.0.0.1 tanpa VITE_PUBLIC_APP_URL, arahkan QR langsung ke URL publik Supabase
    // supaya HP bisa langsung scan & unduh saat tes lokal! Saat sudah di-hosting (domain publik), otomatis pakai /d/:id.
    const isLocalhostUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(cfg.publicBaseUrl)
    const shareUrl = isLocalhostUrl ? photoPublicUrl : `${cfg.publicBaseUrl}/d/${id}`

    return {
      id,
      shareUrl,
      expiresAt,
      manifest,
      isLocalFallback: false,
    }
  }

  // Mode 2: Serverless Upload Endpoint kustom (mis. /api/upload-result)
  if (cfg.customEndpoint) {
    if (!navigator.onLine) {
      throw new Error('Tidak ada koneksi internet. Cek jaringanmu atau gunakan Unduh Langsung.')
    }

    const formData = new FormData()
    formData.append('id', id)
    formData.append('photo', compressedPhoto, `${id}.jpg`)
    if (videoBlob && videoBlob.size > 0) {
      formData.append('video', videoBlob, `${id}.webm`)
    }
    if (frameName) formData.append('frameName', frameName)
    formData.append('expiresAt', expiresAt)

    const res = await fetch(cfg.customEndpoint, {
      method: 'POST',
      body: formData,
      signal,
    })

    if (!res.ok) {
      throw new Error(`Gagal mengunggah ke server (HTTP ${res.status}).`)
    }

    const data = (await res.json()) as {
      id: string
      photoUrl: string
      videoUrl?: string
      expiresAt?: string
    }
    onProgress?.(100)

    const manifest: SharedResultManifest = {
      id: data.id || id,
      photoUrl: data.photoUrl,
      videoUrl: data.videoUrl,
      createdAt: now.toISOString(),
      expiresAt: data.expiresAt || expiresAt,
      frameName,
    }

    return {
      id: manifest.id,
      shareUrl: `${cfg.publicBaseUrl}/d/${manifest.id}`,
      expiresAt: manifest.expiresAt,
      manifest,
      isLocalFallback: false,
    }
  }

  // Mode 3: Fallback Demo Lokal (jika VITE_SUPABASE_URL belum diisi di .env)
  // Memungkinkan tes alur QR & halaman /d/:id langsung di perangkat yang sama.
  onProgress?.(55)
  const photoDataUrl = await blobToDataUrl(compressedPhoto)
  onProgress?.(85)

  const manifest: SharedResultManifest = {
    id,
    photoUrl: photoDataUrl,
    createdAt: now.toISOString(),
    expiresAt,
    frameName,
  }

  try {
    localStorage.setItem(`${LOCAL_CACHE_PREFIX}${id}`, JSON.stringify(manifest))
  } catch {
    throw new Error(
      'Penyimpanan lokal penuh dan VITE_SUPABASE_URL belum dikonfigurasi. Gunakan Unduh Langsung.'
    )
  }

  onProgress?.(100)
  return {
    id,
    shareUrl: `${cfg.publicBaseUrl}/d/${id}`,
    expiresAt,
    manifest,
    isLocalFallback: true,
  }
}

/**
 * Ambil data hasil foto publik berdasarkan :id untuk halaman /d/:id.
 * Otomatis memvalidasi masa kedaluwarsa 24 jam.
 */
export async function fetchSharedResult(
  id: string,
  signal?: AbortSignal
): Promise<FetchSharedResultResponse> {
  const safeId = id.trim()
  if (!safeId || !/^[a-zA-Z0-9_-]{8,64}$/.test(safeId)) {
    return { status: 'not_found' }
  }

  const cfg = getSupabaseConfig()

  // 1. Cek Supabase Storage publik jika terkonfigurasi
  if (cfg.url) {
    try {
      const metaUrl = `${cfg.url}/storage/v1/object/public/${cfg.bucket}/meta/${safeId}.json`
      const res = await fetch(metaUrl, { signal, cache: 'no-store' })

      if (res.status === 404 || res.status === 400) {
        return { status: 'not_found' }
      }
      if (!res.ok) {
        return { status: 'error', message: `Gagal memuat data hasil foto (HTTP ${res.status}).` }
      }

      const manifest = (await res.json()) as SharedResultManifest
      if (manifest.expiresAt && Date.now() > new Date(manifest.expiresAt).getTime()) {
        return { status: 'expired', expiresAt: manifest.expiresAt }
      }
      return { status: 'ok', data: manifest }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { status: 'error', message: 'Permintaan dibatalkan.' }
      }
      return {
        status: 'error',
        message: 'Tidak dapat terhubung ke server. Periksa koneksi internet kamu.',
      }
    }
  }

  // 2. Fallback lokal untuk testing di localhost sebelum Supabase dikonfigurasi
  try {
    const raw = localStorage.getItem(`${LOCAL_CACHE_PREFIX}${safeId}`)
    if (!raw) return { status: 'not_found' }
    const manifest = JSON.parse(raw) as SharedResultManifest
    if (manifest.expiresAt && Date.now() > new Date(manifest.expiresAt).getTime()) {
      localStorage.removeItem(`${LOCAL_CACHE_PREFIX}${safeId}`)
      return { status: 'expired', expiresAt: manifest.expiresAt }
    }
    return { status: 'ok', data: manifest }
  } catch {
    return { status: 'not_found' }
  }
}
