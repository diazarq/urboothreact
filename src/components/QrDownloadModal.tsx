import React, { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  X,
  Copy,
  Check,
  MessageCircle,
  Clock,
  RefreshCw,
  Download,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Info,
} from 'lucide-react'
import { useResultUpload } from '../hooks/useResultUpload'
import { sound } from '../utils/sound'

interface QrDownloadModalProps {
  isOpen: boolean
  onClose: () => void
  photoBlob: Blob | null
  videoBlob?: Blob | null
  frameName?: string
  onDirectDownloadFallback: () => void
  isDark: boolean
}

export const QrDownloadModal: React.FC<QrDownloadModalProps> = ({
  isOpen,
  onClose,
  photoBlob,
  videoBlob = null,
  frameName,
  onDirectDownloadFallback,
  isDark,
}) => {
  const [copied, setCopied] = useState(false)

  const {
    status,
    progress,
    shareUrl,
    errorMessage,
    isLocalFallback,
    startUpload,
    retry,
    cancel,
    reset,
  } = useResultUpload(photoBlob, { videoBlob, frameName })

  // Mulai upload otomatis saat modal dibuka; batalkan & bersihkan saat ditutup
  useEffect(() => {
    if (isOpen) {
      if (status === 'idle') {
        void startUpload()
      }
    } else {
      cancel()
      reset()
      setCopied(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen) return null

  const handleClose = () => {
    sound.playClick()
    cancel()
    onClose()
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return
    sound.playClick()
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback jika clipboard API diblokir
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  const whatsappHref = shareUrl
    ? `https://wa.me/?text=${encodeURIComponent(
        `Ini hasil foto photobooth URBOOTH aku! Buka link ini untuk unduh (berlaku 24 jam): ${shareUrl}`
      )}`
    : '#'

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl my-auto ${
          isDark ? 'glass-panel-dark text-white' : 'glass-panel-light text-slate-900'
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Tutup modal QR"
          className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
            isDark
              ? 'bg-white/10 text-slate-200 hover:bg-white/20'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold font-black tracking-tight">
            Unduh Foto via QR
          </h2>
          <p
            className={`text-sm mt-1 leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            Scan kode QR di bawah ini pakai kamera HP kamu untuk langsung simpan hasilnya.
          </p>
        </div>

        {/* ==================== STATE: UPLOADING ==================== */}
        {(status === 'idle' || status === 'uploading') && (
          <div className="mt-6 py-8 flex flex-col items-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FFB020]/15 border border-[#FFB020]/30 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-[#FFB020] animate-spin" />
            </div>

            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Mengompres & mengunggah hasil foto...</span>
                <span className="font-semibold text-[#FFB020]">{progress}%</span>
              </div>
              <div
                className={`w-full h-2.5 rounded-full overflow-hidden ${
                  isDark ? 'bg-white/10' : 'bg-slate-200'
                }`}
              >
                <div
                  className="h-full bg-[#FFB020] text-[#0F0F14] transition-all duration-200"
                  style={{ width: `${Math.max(8, progress)}%` }}
                />
              </div>
            </div>

            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Foto dikompresi otomatis (maks. ~2 MB) agar cepat dibuka di HP.
            </p>
          </div>
        )}

        {/* ==================== STATE: ERROR ==================== */}
        {status === 'error' && (
          <div className="mt-6 space-y-4">
            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/35 text-left flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-red-400">Gagal Membuat Link QR</p>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {errorMessage || 'Terjadi gangguan koneksi saat mengunggah foto.'}
                </p>
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Tenang, hasil fotomu tetap aman dan tidak hilang.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  sound.playClick()
                  retry()
                }}
                className="w-full min-h-[48px] py-3 rounded-2xl bg-[#FFB020] hover:bg-[#F28C1B] text-[#0F0F14] font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Lagi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick()
                  onDirectDownloadFallback()
                }}
                className={`w-full min-h-[48px] py-3 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                    : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Download className="w-4 h-4 text-[#FFB020]" />
                <span>Unduh Langsung di Perangkat Ini</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== STATE: SUCCESS ==================== */}
        {status === 'success' && shareUrl && (
          <div className="mt-5 flex flex-col items-center space-y-4">
            {/* QR Code SVG >= 240px, latar putih, margin cukup */}
            <div className="p-4 rounded-2xl bg-white shadow-xl border border-slate-200 inline-flex flex-col items-center">
              <QRCodeSVG
                value={shareUrl}
                size={240}
                bgColor="#FFFFFF"
                fgColor="#090A10"
                level="M"
                includeMargin
              />
            </div>

            {/* Info Kedaluwarsa 24 Jam */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-400 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Link berlaku 24 jam</span>
            </div>

            {isLocalFallback && (
              <div
                className={`w-full p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 text-left ${
                  isDark
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
                    : 'bg-sky-50 border-sky-200 text-sky-900'
                }`}
              >
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  Mode tes lokal aktif (<code>VITE_SUPABASE_URL</code> belum diatur). Link bisa
                  dibuka langsung di browser ini; atur Supabase Storage di <code>.env</code> agar
                  bisa di-scan dari HP lain.
                </span>
              </div>
            )}

            {/* Link yang bisa disalin */}
            <div className="w-full space-y-2">
              <div
                className={`flex items-center gap-2 p-2 rounded-xl border ${
                  isDark ? 'bg-slate-950/60 border-white/15' : 'bg-slate-100 border-slate-300'
                }`}
              >
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  aria-label="Link unduh hasil foto"
                  className="flex-1 bg-transparent text-xs font-semibold px-2 focus:outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-lg bg-[#FFB020] hover:bg-[#F28C1B] text-[#0F0F14] text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tombol Kirim via WhatsApp & Buka Halaman */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sound.playClick()}
                  className="min-h-[46px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Kirim via WhatsApp</span>
                </a>

                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sound.playClick()}
                  className={`min-h-[46px] py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
                    isDark
                      ? 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                      : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka Halaman Unduh</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
