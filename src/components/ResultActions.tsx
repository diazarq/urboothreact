import React from 'react'
import { Download, QrCode, Film } from 'lucide-react'
import { sound } from '../utils/sound'

interface ResultActionsProps {
  onDownloadPhoto: () => void
  onDownloadVideo?: () => void
  onOpenQrDownload: () => void
  hasVideo?: boolean
  isExportingVideo?: boolean
  disabled?: boolean
  isDark: boolean
}

export const ResultActions: React.FC<ResultActionsProps> = ({
  onDownloadPhoto,
  onDownloadVideo,
  onOpenQrDownload,
  hasVideo = false,
  isExportingVideo = false,
  disabled = false,
  isDark,
}) => {
  return (
    <div className="space-y-3">
      {/* Opsi A: Satu Tombol Utama solid var(--accent) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          sound.playClick()
          onDownloadPhoto()
        }}
        className="btn-primary w-full min-h-[52px] py-3.5 px-5 text-[14px] flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
      >
        <Download className="w-5 h-5" />
        <span>Unduh foto</span>
      </button>

      {/* Tombol Video / Timelapse jika tersedia */}
      {hasVideo && onDownloadVideo && (
        <button
          type="button"
          disabled={disabled || isExportingVideo}
          onClick={() => {
            sound.playClick()
            onDownloadVideo()
          }}
          className={`btn-secondary w-full min-h-[48px] py-3.5 px-5 text-[14px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
            isDark ? '' : '!bg-white !text-[#0F0F14] !border-slate-300'
          }`}
        >
          <Film className="w-4 h-4 text-[#FFB020]" />
          <span>{isExportingVideo ? 'Menyiapkan video...' : 'Unduh video / timelapse'}</span>
        </button>
      )}

      {/* Opsi B: Tombol Sekunder kaca tipis - Unduh via QR */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          sound.playClick()
          onOpenQrDownload()
        }}
        className={`btn-secondary w-full min-h-[50px] py-3.5 px-5 text-[14px] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 ${
          isDark ? '' : '!bg-white !text-[#0F0F14] !border-slate-300'
        }`}
      >
        <QrCode className="w-5 h-5 text-[#FFB020]" />
        <span>Unduh via QR</span>
      </button>
    </div>
  )
}
