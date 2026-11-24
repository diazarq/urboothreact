export type FeedbackCategory = 'Saran' | 'Kritik' | 'Request Frame' | 'Bug'

export interface FeedbackItem {
  id: string
  name: string
  category: FeedbackCategory
  message: string
  rating: number
  isRead: boolean
  createdAt: string
}

interface SupabaseFeedbackRow {
  id: string
  name: string | null
  category: string | null
  message: string
  rating: number | null
  is_read: boolean | null
  created_at: string
}

const LOCAL_KEY = 'urbooth_feedbacks_v1'

function getConfig() {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, '') || ''
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || ''
  return { url, anonKey }
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const { anonKey } = getConfig()
  const headers: Record<string, string> = {
    apikey: anonKey,
    ...extra,
  }
  if (anonKey && !anonKey.startsWith('sb_publishable_')) {
    headers.Authorization = `Bearer ${anonKey}`
  }
  return headers
}

function readLocalFeedbacks(): FeedbackItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? (JSON.parse(raw) as FeedbackItem[]) : []
  } catch {
    return []
  }
}

function writeLocalFeedbacks(list: FeedbackItem[]): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

export async function fetchFeedbacks(): Promise<FeedbackItem[]> {
  const { url, anonKey } = getConfig()
  if (url && anonKey) {
    try {
      const res = await fetch(`${url}/rest/v1/feedbacks?select=*&order=created_at.desc`, {
        headers: authHeaders(),
        cache: 'no-store',
      })
      if (res.ok) {
        const rows = (await res.json()) as SupabaseFeedbackRow[]
        const mapped: FeedbackItem[] = rows.map((r) => ({
          id: r.id,
          name: r.name || 'Anonim',
          category: (r.category as FeedbackCategory) || 'Saran',
          message: r.message,
          rating: r.rating || 5,
          isRead: Boolean(r.is_read),
          createdAt: r.created_at,
        }))
        writeLocalFeedbacks(mapped)
        return mapped
      }
    } catch (err) {
      console.error('Gagal mengambil saran & kritik dari Supabase:', err)
    }
  }
  return readLocalFeedbacks()
}

export async function submitFeedback(input: {
  name: string
  category: FeedbackCategory
  message: string
  rating: number
}): Promise<FeedbackItem> {
  const item: FeedbackItem = {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim() || 'Anonim',
    category: input.category,
    message: input.message.trim(),
    rating: input.rating,
    isRead: false,
    createdAt: new Date().toISOString(),
  }

  // Simpan juga secara lokal agar langsung muncul di sesi ini
  const current = readLocalFeedbacks()
  writeLocalFeedbacks([item, ...current])

  const { url, anonKey } = getConfig()
  if (url && anonKey) {
    try {
      await fetch(`${url}/rest/v1/feedbacks`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          id: item.id,
          name: item.name,
          category: item.category,
          message: item.message,
          rating: item.rating,
          is_read: false,
          created_at: item.createdAt,
        }),
      })
    } catch (err) {
      console.error('Gagal mengirim saran & kritik ke Supabase:', err)
    }
  }

  return item
}

export async function markFeedbackRead(id: string): Promise<void> {
  const updated = readLocalFeedbacks().map((f) => (f.id === id ? { ...f, isRead: true } : f))
  writeLocalFeedbacks(updated)

  const { url, anonKey } = getConfig()
  if (url && anonKey) {
    try {
      await fetch(`${url}/rest/v1/feedbacks?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ is_read: true }),
      })
    } catch (err) {
      console.error('Gagal update status dibaca di Supabase:', err)
    }
  }
}

export async function deleteFeedback(id: string): Promise<void> {
  const updated = readLocalFeedbacks().filter((f) => f.id !== id)
  writeLocalFeedbacks(updated)

  const { url, anonKey } = getConfig()
  if (url && anonKey) {
    try {
      await fetch(`${url}/rest/v1/feedbacks?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
    } catch (err) {
      console.error('Gagal menghapus feedback di Supabase:', err)
    }
  }
}
