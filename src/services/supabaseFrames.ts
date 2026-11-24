import type { FrameTemplate } from '../types'
import { dataUrlToBlob } from '../utils/download'

interface SupabaseFrameRow {
  id: string
  data: FrameTemplate
  is_active: boolean
  is_deleted?: boolean
  expires_at?: string | null
  created_at?: string
}

function getConfig() {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, '') || ''
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || ''
  const framesBucket =
    (import.meta.env.VITE_SUPABASE_FRAMES_BUCKET as string | undefined) || 'urbooth-frames'
  return { url, anonKey, framesBucket }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getConfig()
  return Boolean(url && anonKey)
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const { anonKey } = getConfig()
  const headers: Record<string, string> = {
    apikey: anonKey,
    ...extra,
  }
  // Supabase publishable key (sb_publishable_...) tidak memakai header Authorization Bearer (bukan JWT)
  if (anonKey && !anonKey.startsWith('sb_publishable_')) {
    headers.Authorization = `Bearer ${anonKey}`
  }
  return headers
}

/**
 * Mengunggah gambar frame admin (PNG/JPG data URL) ke Supabase Storage bucket `urbooth-frames`
 * agar semua pengunjung bisa memuatnya dengan cepat.
 */
async function uploadDataUrlIfNeeded(
  maybeDataUrl: string | undefined,
  frameId: string,
  suffix: string
): Promise<string | undefined> {
  if (!maybeDataUrl || !maybeDataUrl.startsWith('data:')) return maybeDataUrl
  const { url, framesBucket } = getConfig()
  if (!url) return maybeDataUrl

  const blob = dataUrlToBlob(maybeDataUrl)
  const ext = blob.type.includes('png') ? 'png' : 'jpg'
  const path = `frames/${frameId}_${suffix}.${ext}`
  const endpoint = `${url}/storage/v1/object/${framesBucket}/${path}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: authHeaders({
      'Content-Type': blob.type || 'image/png',
      'x-upsert': 'true',
      'cache-control': '31536000',
    }),
    body: blob,
  })

  if (!res.ok) {
    throw new Error(`Gagal mengunggah gambar frame ke Supabase Storage (HTTP ${res.status}).`)
  }

  return `${url}/storage/v1/object/public/${framesBucket}/${path}`
}

/**
 * Mengambil seluruh frame dari Supabase dan menggabungkannya dengan daftar frame bawaan.
 * Frame baru dari admin muncul paling atas, dan perubahan ON/OFF/hapus ikut sinkron ke semua user.
 */
export async function fetchSyncedFrames(baseFrames: FrameTemplate[]): Promise<FrameTemplate[]> {
  if (!isSupabaseConfigured()) return baseFrames
  const { url } = getConfig()

  try {
    const res = await fetch(`${url}/rest/v1/frames?select=*&order=created_at.desc`, {
      headers: authHeaders(),
      cache: 'no-store',
    })
    if (!res.ok) return baseFrames

    const rows = (await res.json()) as SupabaseFrameRow[]
    if (!Array.isArray(rows) || rows.length === 0) return baseFrames

    const rowMap = new Map<string, SupabaseFrameRow>()
    rows.forEach((r) => rowMap.set(r.id, r))

    const baseIdSet = new Set(baseFrames.map((f) => f.id))

    // 1. Frame baru yang dibuat admin di cloud (bukan frame bawaan)
    const cloudOnlyFrames: FrameTemplate[] = rows
      .filter((r) => !baseIdSet.has(r.id) && !r.is_deleted)
      .map((r) => ({
        ...r.data,
        isActive: r.is_active,
        expiresAt: r.expires_at ?? r.data.expiresAt,
      }))

    // 2. Frame bawaan yang sudah di-override status ON/OFF/expiry/hapus oleh admin
    const mergedBaseFrames: FrameTemplate[] = baseFrames
      .filter((bf) => !rowMap.get(bf.id)?.is_deleted)
      .map((bf) => {
        const override = rowMap.get(bf.id)
        if (!override) return bf
        return {
          ...bf,
          ...override.data,
          isActive: override.is_active,
          expiresAt: override.expires_at ?? override.data.expiresAt ?? bf.expiresAt,
        }
      })

    return [...cloudOnlyFrames, ...mergedBaseFrames]
  } catch (err) {
    console.error('Supabase frame sync failed, using local catalog:', err)
    return baseFrames
  }
}

/**
 * Menyimpan frame baru atau update status ON/OFF/expiry frame ke Supabase.
 */
export async function upsertCloudFrame(frame: FrameTemplate): Promise<FrameTemplate> {
  if (!isSupabaseConfigured()) return frame
  const { url } = getConfig()

  const uploadedOverlay = await uploadDataUrlIfNeeded(frame.customOverlayUrl, frame.id, 'ov')
  const uploadedTemplate = await uploadDataUrlIfNeeded(frame.imageTemplateUrl, frame.id, 'tpl')

  const cleanFrame: FrameTemplate = {
    ...frame,
    customOverlayUrl: uploadedOverlay,
    imageTemplateUrl: uploadedTemplate,
  }

  const payload = {
    id: cleanFrame.id,
    data: cleanFrame,
    is_active: cleanFrame.isActive !== false,
    is_deleted: false,
    expires_at: cleanFrame.expiresAt || null,
    updated_at: new Date().toISOString(),
  }

  const res = await fetch(`${url}/rest/v1/frames`, {
    method: 'POST',
    headers: authHeaders({
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    }),
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`Gagal menyimpan frame ke Supabase (HTTP ${res.status}).`)
  }

  return cleanFrame
}

/**
 * Menandai frame sebagai terhapus di Supabase sehingga hilang juga di tampilan semua user.
 */
export async function deleteCloudFrame(frame: FrameTemplate): Promise<void> {
  if (!isSupabaseConfigured()) return
  const { url } = getConfig()

  await fetch(`${url}/rest/v1/frames`, {
    method: 'POST',
    headers: authHeaders({
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    }),
    body: JSON.stringify({
      id: frame.id,
      data: frame,
      is_active: false,
      is_deleted: true,
      updated_at: new Date().toISOString(),
    }),
  })
}
