import type { PhotoSession, User } from '../types'

const DB_NAME = 'urbooth_photobooth_db'
const DB_VERSION = 2
const STORE_NAME = 'photo_sessions'
const USER_KEY = 'urbooth_photobooth_user'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('userId', 'userId', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const storage = {
  getCurrentUser(): User {
    try {
      const stored = localStorage.getItem(USER_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      // Fallback
    }

    const guestUser: User = {
      id: 'guest_anonymous',
      email: '',
      name: 'Guest Explorer',
      role: 'guest',
      createdAt: new Date().toISOString(),
    }
    return guestUser
  },

  setCurrentUser(user: User): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch (e) {
      console.error('Failed to set current user:', e)
    }
  },

  logoutUser(): User {
    const guestUser: User = {
      id: 'guest_anonymous',
      email: '',
      name: 'Guest Explorer',
      role: 'guest',
      createdAt: new Date().toISOString(),
    }
    this.setCurrentUser(guestUser)
    return guestUser
  },

  async savePhotoSession(session: PhotoSession): Promise<void> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const req = store.put(session)

        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    } catch (e) {
      console.warn('IndexedDB failed, saving to fallback:', e)
      const list = this.getFallbackSessions()
      list.unshift(session)
      try {
        localStorage.setItem('urbooth_sessions_fallback', JSON.stringify(list.slice(0, 15)))
      } catch (err) {
        console.error('LocalStorage quota exceeded:', err)
      }
    }
  },

  async getUserPhotos(userId: string): Promise<PhotoSession[]> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const index = store.index('userId')
        const req = index.getAll(userId)

        req.onsuccess = () => {
          const results = (req.result || []) as PhotoSession[]
          results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          resolve(results)
        }
        req.onerror = () => reject(req.error)
      })
    } catch {
      const fallback = this.getFallbackSessions().filter((s) => s.userId === userId)
      return fallback
    }
  },

  async deletePhotoSession(id: string): Promise<void> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const req = store.delete(id)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    } catch {
      const fallback = this.getFallbackSessions().filter((s) => s.id !== id)
      localStorage.setItem('urbooth_sessions_fallback', JSON.stringify(fallback))
    }
  },

  getFallbackSessions(): PhotoSession[] {
    try {
      const data = localStorage.getItem('urbooth_sessions_fallback')
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },
}
