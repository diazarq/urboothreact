import React, { useState } from 'react'
import { X, Lock, CheckCircle2, ArrowRight, Mail, KeyRound, Sparkles } from 'lucide-react'
import type { User } from '../types'
import { sound } from '../utils/sound'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: User) => void
  lockedFrameName?: string
  isDark?: boolean
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lockedFrameName,
  isDark = true,
}) => {
  const [tab, setTab] = useState<'signin' | 'register'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Masukkan email dan password kamu.')
      return
    }

    if (password.length < 4) {
      setError('Password minimal 4 karakter.')
      return
    }

    setLoading(true)
    sound.playClick()

    setTimeout(() => {
      const user: User = {
        id: `user_${Date.now()}`,
        email: email.trim(),
        name: name.trim() || email.split('@')[0],
        role: 'member',
        createdAt: new Date().toISOString(),
      }
      setLoading(false)
      onSuccess(user)
      onClose()
    }, 500)
  }

  const handleSimulateGoogle = () => {
    sound.playClick()
    setLoading(true)
    setTimeout(() => {
      const user: User = {
        id: `google_user_${Date.now()}`,
        email: 'creator@urbooth.id',
        name: 'Urbooth Creator',
        role: 'member',
        createdAt: new Date().toISOString(),
      }
      setLoading(false)
      onSuccess(user)
      onClose()
    }, 450)
  }

  const handleQuickDemoMember = () => {
    sound.playClick()
    const user: User = {
      id: 'demo_member_01',
      email: 'vip@urbooth.id',
      name: 'Member VIP',
      role: 'member',
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    onSuccess(user)
    onClose()
  }

  const handleQuickAdminLogin = () => {
    sound.playClick()
    const adminUser: User = {
      id: 'admin_urbooth_01',
      email: 'admin@urbooth.id',
      name: 'Admin Urbooth',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    onSuccess(adminUser)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md rounded-3xl border shadow-2xl p-6 sm:p-8 ${
          isDark
            ? 'bg-[#17171D] border-zinc-800 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <button
          onClick={() => {
            sound.playClick()
            onClose()
          }}
          className={`absolute top-5 right-5 p-2 rounded-full transition-colors cursor-pointer ${
            isDark
              ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              : 'text-zinc-500 hover:text-black hover:bg-zinc-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#EC4899]/15 text-[#EC4899] text-[10px] font-extrabold tracking-wider uppercase mb-2">
            <Lock className="w-3 h-3" />
            <span>URBOOTH MEMBER ACCESS</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">
            {lockedFrameName ? `Buka "${lockedFrameName}"` : 'Masuk ke Akun Urbooth'}
          </h2>

          <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Login untuk membuka akses menu <strong>Frame Kita</strong>, membuat frame kustom sendiri,
            membuka semua frame PRO, dan menyimpan riwayat foto.
          </p>
        </div>

        <div
          className={`mb-5 p-3.5 rounded-2xl border space-y-2 text-xs ${
            isDark
              ? 'bg-[#111115] border-zinc-800 text-zinc-300'
              : 'bg-zinc-50 border-zinc-200 text-zinc-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#EC4899] shrink-0" />
            <span>Akses menu "Frame Kita" & buat frame kustom sendiri</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#EC4899] shrink-0" />
            <span>Unlock seluruh frame Special Event, Cartoon, Band & Arcade</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#EC4899] shrink-0" />
            <span>Simpan otomatis semua photo strip ke Galeri Akun</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSimulateGoogle}
          disabled={loading}
          className={`w-full mb-4 py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2.5 transition-all cursor-pointer ${
            isDark
              ? 'bg-white text-zinc-900 hover:bg-zinc-100 border-white'
              : 'bg-zinc-900 text-white hover:bg-zinc-800 border-zinc-900'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Lanjutkan dengan Google</span>
        </button>

        <div
          className={`flex p-1 rounded-xl border mb-4 ${
            isDark ? 'bg-[#111115] border-zinc-800' : 'bg-zinc-100 border-zinc-200'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setTab('signin')
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === 'signin'
                ? 'bg-[#EC4899] text-white'
                : isDark
                ? 'text-zinc-400 hover:text-white'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setTab('register')
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === 'register'
                ? 'bg-[#EC4899] text-white'
                : isDark
                ? 'text-zinc-400 hover:text-white'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-bold uppercase mb-1 opacity-75">
                Nama Kamu
              </label>
              <input
                type="text"
                placeholder="misal: Raka Putra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-[#EC4899] ${
                  isDark
                    ? 'bg-[#111115] border-zinc-800 text-white'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                }`}
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase mb-1 opacity-75 flex items-center justify-between">
              <span>Email</span>
              <Mail className="w-3 h-3" />
            </label>
            <input
              type="email"
              required
              placeholder="kamu@urbooth.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-[#EC4899] ${
                isDark
                  ? 'bg-[#111115] border-zinc-800 text-white'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase mb-1 opacity-75 flex items-center justify-between">
              <span>Password</span>
              <KeyRound className="w-3 h-3" />
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-[#EC4899] ${
                isDark
                  ? 'bg-[#111115] border-zinc-800 text-white'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-[#EC4899]/25 mt-2"
          >
            <span>{tab === 'signin' ? 'Masuk & Buka Semua Fitur' : 'Buat Akun Member'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-zinc-800/40 flex flex-col items-center gap-2.5 text-center">
          <button
            type="button"
            onClick={handleQuickDemoMember}
            className="text-xs font-bold text-[#EC4899] hover:underline flex items-center justify-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Klik Demo: Masuk sebagai Member (User Biasa)</span>
          </button>

          <button
            type="button"
            onClick={handleQuickAdminLogin}
            className="text-xs font-bold text-amber-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>1-Klik Demo: Masuk sebagai Admin Panel</span>
          </button>
        </div>
      </div>
    </div>
  )
}
