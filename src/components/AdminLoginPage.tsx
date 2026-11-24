import React, { useState } from 'react'
import { ShieldCheck, Lock, User, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react'
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
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sound.playClick()

    const normalizedUser = username.trim().toLowerCase()
    if (normalizedUser === 'admindiaz' && password === 'anjaymabar') {
      setError('')
      onLoginSuccess()
    } else {
      setError('Username atau kata sandi admin tidak valid.')
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
              className={`block text-[12px] font-semibold mb-1.5 ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              Username Admin
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B8B8C4]" />
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username admin"
                className={`w-full pl-10 pr-4 py-3 rounded-[16px] border text-[14px] font-normal focus:outline-none focus:border-[#FFB020] ${
                  isDark
                    ? 'bg-white/6 border-white/12 text-white placeholder-[#B8B8C4]'
                    : 'bg-white border-slate-300 text-[#0F0F14] placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          <div>
            <label
              className={`block text-[12px] font-semibold mb-1.5 ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B8B8C4]" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-3 rounded-[16px] border text-[14px] font-normal focus:outline-none focus:border-[#FFB020] ${
                  isDark
                    ? 'bg-white/6 border-white/12 text-white placeholder-[#B8B8C4]'
                    : 'bg-white border-slate-300 text-[#0F0F14] placeholder-slate-400'
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
