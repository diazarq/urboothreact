import React from 'react'
import { Heart, X, Sparkles, QrCode } from 'lucide-react'
import { sound } from '../utils/sound'

interface SaweriaModalProps {
  isOpen: boolean
  onClose: () => void
  isDark: boolean
}

export const SaweriaModal: React.FC<SaweriaModalProps> = ({ isOpen, onClose, isDark }) => {
  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md rounded-3xl p-6 sm:p-7 text-center shadow-2xl ${
          isDark ? 'glass-panel-dark text-white' : 'glass-panel-light text-slate-900'
        }`}
      >
        <button
          onClick={() => {
            sound.playClick()
            onClose()
          }}
          aria-label="Tutup"
          className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
            isDark
              ? 'bg-white/10 text-slate-200 hover:bg-white/20'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <span className="badge-outline inline-flex items-center gap-1.5 mb-3">
          <Heart className="w-3.5 h-3.5 fill-current" />
          <span>DUKUNG URBOOTH</span>
        </span>

        <h2 className="text-heading">Traktir kopi via Saweria</h2>
        <p
          className={`text-[14px] mt-1.5 leading-[1.6] ${
            isDark ? 'text-[#B8B8C4]' : 'text-slate-600'
          }`}
        >
          Suka pakai Urbooth gratis tanpa batas? Yuk donasi seikhlasnya lewat QR Saweria di bawah
          ini supaya website makin kencang dan frame barunya makin banyak.
        </p>

        {/* White QR container for 100% reliable scanning */}
        <div className="mt-5 inline-flex flex-col items-center p-4 rounded-[16px] bg-white border border-slate-200">
          <img
            src="/saweria-qr.png"
            alt="QR Code Saweria Donasi Urbooth"
            className="w-56 h-56 sm:w-60 sm:h-60 object-contain"
          />
          <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#0F0F14]">
            <QrCode className="w-4 h-4 text-[#F28C1B]" />
            <span>Scan dengan QRIS / GoPay / OVO / DANA / ShopeePay</span>
          </div>
        </div>

        <div
          className={`mt-4 flex items-center justify-center gap-1.5 text-[12px] font-semibold ${
            isDark ? 'text-[#B8B8C4]' : 'text-slate-600'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#FFB020]" />
          <span>Terima kasih banyak atas dukungan kamu!</span>
        </div>
      </div>
    </div>
  )
}
