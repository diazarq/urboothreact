import React, { useState } from 'react'
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react'
import { sound } from '../utils/sound'

interface AdminLoginPageProps {
  isDark: boolean
  onLoginSuccess: () => void
  onBackToSite: () => void
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  isDark,
  onLoginSuccess,
  onBackToSite,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sound.playClick()

    const normalizedEmail = email.trim().toLowerCase()
    if (normalizedEmail === 'admin@urbooth.id' && password === 'admin123') {
      setError('')
      onLoginSuccess()
    } else {
      setError('Email atau kata sandi admin tidak valid.')
    }
  }

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden ${
        isDark ? 'bg-[#0F0F14] text-white' : 'bg-[#FFF4E0] text-[#0F0F14]'
      }`}
    >
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="ambient-orb-accent -top-24 -left-24 w-[360px] h-[360px]" />
        <div className="ambient-orb-hover -bottom-24 -right-24 w-[380px] h-[380px]" />
      </div>

      <div
        className={`relative z-10 w-full max-w-md p-7 sm:p-9 ${
          isDark ? 'glass-panel-dark' : 'glass-panel-light'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <span className="logo-box">
            <img src="/urbooth-logo.jpg" alt="Urbooth" className="h-8 w-auto rounded-md" />
          </span>
          <span className="badge-outline inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PORTAL ADMIN</span>
          </span>
        </div>

        <h1 className="text-heading">Masuk panel administrator</h1>
        <p className={`text-[14px] mt-1.5 leading-[1.6] ${isDark ? 'text-[#B8B8C4]' : 'text-slate-600'}`}>
          Halaman khusus pengelola Urbooth untuk mengatur katalog frame, masa aktif, dan pengaturan
          sistem.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/35 text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              className={`block text-xs font-bold mb-1.5 ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              Email Admin
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@urbooth.id"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:border-amber-500 ${
                  isDark
                    ? 'bg-slate-950/60 border-white/15 text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          <div>
            <label
              className={`block text-xs font-bold mb-1.5 ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:border-amber-500 ${
                  isDark
                    ? 'bg-slate-950/60 border-white/15 text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3.5 text-[14px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Masuk ke dasbor admin</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div
          className={`mt-5 p-3.5 rounded-xl border text-xs leading-relaxed ${
            isDark
              ? 'bg-white/5 border-white/10 text-slate-300'
              : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}
        >
          <span className="font-semibold text-[#FFB020]">Kredensial lokal:</span>{' '}
          <code className="font-semibold">admin@urbooth.id</code> /{' '}
          <code className="font-semibold">admin123</code>
        </div>

        <button
          type="button"
          onClick={() => {
            sound.playClick()
            onBackToSite()
          }}
          className={`mt-5 w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            isDark
              ? 'text-slate-300 hover:text-white hover:bg-white/5'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/70'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Halaman Photobooth</span>
        </button>
      </div>
    </div>
  )
}
