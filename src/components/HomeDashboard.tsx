import React, { useState } from 'react'
import {
  ArrowRight,
  Users,
  Sparkles,
  Camera,
  Upload,
  Palette,
  Video,
  Layers,
  Heart,
  QrCode,
  MessageSquare,
  Send,
  Star,
  Check,
} from 'lucide-react'
import type { FrameTemplate } from '../types'
import { PHOTO_FILTERS } from '../constants/filters'
import { FrameCardPreview } from './FrameCardPreview'
import { sound } from '../utils/sound'
import type { FeedbackCategory } from '../services/feedbackService'

interface HomeDashboardProps {
  frames: FrameTemplate[]
  isDark: boolean
  onStartPhotobooth: (frame?: FrameTemplate) => void
  onStartUpload: (frame?: FrameTemplate) => void
  onNavigateTab: (tab: 'frames' | 'my_frames' | 'studio' | 'gallery') => void
  onSelectFrameDetail: (frame: FrameTemplate) => void
  onOpenDonate: () => void
  onSubmitFeedback: (input: {
    name: string
    category: FeedbackCategory
    message: string
    rating: number
  }) => Promise<void>
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  frames,
  isDark,
  onStartPhotobooth,
  onStartUpload,
  onNavigateTab,
  onSelectFrameDetail,
  onOpenDonate,
  onSubmitFeedback,
}) => {
  const [fbName, setFbName] = useState('')
  const [fbCategory, setFbCategory] = useState<FeedbackCategory>('Saran')
  const [fbRating, setFbRating] = useState(5)
  const [fbMessage, setFbMessage] = useState('')
  const [fbSubmitting, setFbSubmitting] = useState(false)
  const [fbSent, setFbSent] = useState(false)

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fbMessage.trim() || fbSubmitting) return
    sound.playClick()
    setFbSubmitting(true)
    try {
      await onSubmitFeedback({
        name: fbName,
        category: fbCategory,
        message: fbMessage,
        rating: fbRating,
      })
      setFbName('')
      setFbMessage('')
      setFbRating(5)
      setFbSent(true)
      window.setTimeout(() => setFbSent(false), 3500)
    } finally {
      setFbSubmitting(false)
    }
  }
  const musicFrame = frames.find((f) => f.id === 'ios_music_player_1x3') || frames[0]
  const denimFrame = frames.find((f) => f.themeType === 'denim_street') || frames[1] || frames[0]
  const koranFrame = frames.find((f) => f.themeType === 'newspaper') || frames[2] || frames[0]
  const memeFrame = frames.find((f) => f.themeType === 'meme_viral') || frames[3] || frames[0]
  const ticketFrame =
    frames.find((f) => f.id === 'capturing_moments_maroon_1x3') || frames[4] || frames[0]

  const secondaryCards = [
    {
      id: 'meme_duo',
      badge: 'PALING SERU',
      title: 'Mode Meme & Duo',
      description: 'Pose bareng frame meme viral, komik Spider-Man, plus stiker lucu.',
      previewFrame: memeFrame,
      icon: Users,
      onClick: () => onStartPhotobooth(memeFrame),
    },
    {
      id: 'denim_koran',
      badge: 'POPULER',
      title: 'Edisi Denim & Koran',
      description: 'Gaya scrapbook jeans denim, kamera Nikon, dan koran harian The 1975.',
      previewFrame: koranFrame,
      icon: Layers,
      onClick: () => onSelectFrameDetail(denimFrame),
    },
    {
      id: 'create_frame',
      badge: 'KREASI',
      title: 'Unggah & Buat Frame',
      description: 'Pakai desain PNG/JPG dari Canva atau buat bingkai kustom langsung di sini.',
      previewFrame: ticketFrame,
      icon: Palette,
      onClick: () => onNavigateTab('my_frames'),
    },
  ]

  const featuredCollections = [
    {
      id: 'col_1',
      title: 'Koleksi Denim & Scrapbook Jeans',
      author: 'Studio Denim Urbooth',
      tag: 'KOLEKSI DENIM',
      stats: '1.420 kali dipakai',
      frame: denimFrame,
    },
    {
      id: 'col_2',
      title: 'The 1975 — Koran & Strip Film',
      author: 'Redaksi Pers Urbooth',
      tag: 'EDISI KORAN',
      stats: '2.290 kali dipakai',
      frame: koranFrame,
    },
  ]

  const mutedText = isDark ? 'text-[#B8B8C4]' : 'text-slate-600'

  return (
    <div className="w-full space-y-10 pb-12">
      {/* ==================== AKSI UTAMA DOMINAN: STUDIO PHOTOBOOTH ==================== */}
      <section
        className={`p-6 sm:p-8 relative overflow-hidden ${
          isDark ? 'glass-panel-dark' : 'glass-panel-light'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Kiri: Judul Hero, Deskripsi Kontras Tinggi, dan Satu Tombol Utama */}
          <div className="lg:col-span-7 space-y-5">
            <div className="badge-outline inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {frames.length} Frame • {PHOTO_FILTERS.length} Filter
              </span>
            </div>

            <h1 className="text-hero max-w-[16ch]">
              Siap abadikan momen{' '}
              <span className="text-[#FFB020]">seru kamu?</span>
            </h1>

            <p className={`text-[16px] leading-[1.6] max-w-xl ${mutedText}`}>
              Langsung mulai sesi foto di Studio Photobooth dengan kamera langsung, rekaman Video
              Frame mulus 30 FPS, stiker meme, dan pilihan frame estetik tanpa perlu daftar akun.
            </p>

            {/* Hanya SATU tombol utama solid var(--accent) di layar */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                onClick={() => {
                  sound.playClick()
                  onStartPhotobooth(musicFrame)
                }}
                className="btn-primary px-6 py-4 text-[16px] flex items-center gap-2.5 cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span>Mulai Studio Photobooth</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  sound.playClick()
                  onStartUpload(musicFrame)
                }}
                className={`btn-secondary px-5 py-4 text-[14px] flex items-center gap-2 cursor-pointer ${
                  isDark ? '' : '!bg-white !text-[#0F0F14] !border-slate-300'
                }`}
              >
                <Upload className="w-4 h-4 text-[#FFB020]" />
                <span>Unggah foto dari galeri</span>
              </button>
            </div>

            <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-[14px] font-semibold ${mutedText}`}>
              <span className="flex items-center gap-1.5">
                <Video className="w-4 h-4 text-[#FFB020]" />
                Video Frame & Timelapse otomatis
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#FFB020]" />
                {frames.length} desain frame siap pakai
              </span>
            </div>
          </div>

          {/* Kanan: Pratinjau Nyata Kolase 3 Frame Berisi Foto Contoh */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div
              onClick={() => {
                sound.playClick()
                onStartPhotobooth(musicFrame)
              }}
              title="Klik untuk langsung foto dengan frame ini"
              className={`relative w-full max-w-sm h-72 sm:h-80 rounded-[16px] p-4 flex items-center justify-center cursor-pointer group border transition-colors ${
                isDark
                  ? 'bg-[#0F0F14]/75 border-white/12 hover:border-[#FFB020]'
                  : 'bg-slate-200/70 border-slate-300 hover:border-[#FFB020]'
              }`}
            >
              <div className="absolute -left-1 sm:left-3 top-7 h-52 sm:h-56 -rotate-6 opacity-90 group-hover:-rotate-10 transition-transform duration-300">
                <FrameCardPreview
                  frame={denimFrame}
                  className="h-full w-auto rounded-lg shadow-lg"
                />
              </div>

              <div className="relative z-10 h-60 sm:h-68 group-hover:scale-105 transition-transform duration-300">
                <FrameCardPreview
                  frame={musicFrame}
                  className="h-full w-auto rounded-xl shadow-xl ring-1 ring-white/20"
                />
              </div>

              <div className="absolute -right-1 sm:right-3 top-7 h-52 sm:h-56 rotate-6 opacity-90 group-hover:rotate-10 transition-transform duration-300">
                <FrameCardPreview
                  frame={koranFrame}
                  className="h-full w-auto rounded-lg shadow-lg"
                />
              </div>

              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-[#0F0F14] border border-white/15 text-white text-[12px] font-semibold whitespace-nowrap">
                Pratinjau hasil frame nyata
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 3 KARTU AKSI SEKUNDER DENGAN PRATINJAU NYATA ==================== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {secondaryCards.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.id}
              onClick={() => {
                sound.playClick()
                card.onClick()
              }}
              className={`group p-5 text-left transition-all duration-200 hover:-translate-y-1 flex items-center gap-4 cursor-pointer ${
                isDark
                  ? 'glass-card-dark hover:border-[#FFB020]'
                  : 'glass-card-light hover:border-[#FFB020]'
              }`}
            >
              <div
                className={`w-24 h-32 shrink-0 rounded-xl p-2 flex items-center justify-center overflow-hidden border ${
                  isDark
                    ? 'bg-[#0F0F14]/80 border-white/12'
                    : 'bg-slate-200/70 border-slate-300'
                }`}
              >
                <FrameCardPreview
                  frame={card.previewFrame}
                  className="max-h-full w-auto rounded group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <span className="badge-outline inline-flex items-center gap-1">
                  <Icon className="w-3 h-3" />
                  <span>{card.badge}</span>
                </span>
                <h3 className="font-semibold text-[16px] leading-snug">{card.title}</h3>
                <p className={`text-[14px] leading-[1.6] ${mutedText}`}>{card.description}</p>
              </div>
            </button>
          )
        })}
      </section>

      {/* ==================== KOLEKSI PILIHAN ==================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-heading">Koleksi pilihan</h2>
          <button
            onClick={() => {
              sound.playClick()
              onNavigateTab('frames')
            }}
            className="text-[14px] font-semibold text-[#FFB020] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat semua frame</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {featuredCollections.map((ev) => (
            <div
              key={ev.id}
              onClick={() => {
                sound.playClick()
                onSelectFrameDetail(ev.frame)
              }}
              className={`group overflow-hidden cursor-pointer transition-all hover:-translate-y-1 ${
                isDark
                  ? 'glass-card-dark hover:border-[#FFB020]'
                  : 'glass-card-light hover:border-[#FFB020]'
              }`}
            >
              <div
                className={`relative h-48 w-full p-6 flex items-center justify-between overflow-hidden border-b ${
                  isDark ? 'bg-[#16161E] border-white/12' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <div className="z-10 max-w-xs space-y-2.5">
                  <span className="badge-solid inline-block">{ev.tag}</span>
                  <h3 className="font-extrabold text-[24px] leading-[1.2]">{ev.title}</h3>
                </div>

                <div className="z-10 h-40">
                  <FrameCardPreview
                    frame={ev.frame}
                    className="h-full w-auto rounded-lg shadow-lg rotate-3 group-hover:rotate-0 transition-transform"
                  />
                </div>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#FFB020] flex items-center justify-center text-[12px] font-extrabold text-[#0F0F14]">
                    {ev.author[0]}
                  </div>
                  <span className={`text-[14px] font-semibold ${mutedText}`}>{ev.author}</span>
                </div>

                <span className="text-[12px] font-semibold text-[#FFB020]">{ev.stats}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== FRAME TERBARU ==================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-heading">Frame terbaru</h2>
            <span className="badge-outline">{frames.length} DESAIN</span>
          </div>
          <button
            onClick={() => {
              sound.playClick()
              onNavigateTab('frames')
            }}
            className="text-[14px] font-semibold text-[#FFB020] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Jelajahi semua frame</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {frames.slice(0, 6).map((frame) => (
            <div
              key={frame.id}
              onClick={() => {
                sound.playClick()
                onSelectFrameDetail(frame)
              }}
              className={`group relative p-3 cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between ${
                isDark
                  ? 'glass-card-dark hover:border-[#FFB020]'
                  : 'glass-card-light hover:border-[#FFB020]'
              }`}
            >
              <span className="badge-solid absolute top-4 right-4 z-10">
                {frame.badgeText || 'BARU'}
              </span>

              <div
                className={`w-full h-52 rounded-xl flex items-center justify-center p-2 overflow-hidden ${
                  isDark ? 'bg-[#0F0F14]/75' : 'bg-slate-200/70'
                }`}
              >
                <FrameCardPreview
                  frame={frame}
                  className="max-h-full w-auto transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="mt-3 px-1">
                <h4 className="font-semibold text-[14px] truncate">{frame.name}</h4>
                <div className={`flex items-center justify-between text-[12px] mt-1 ${mutedText}`}>
                  <span>{frame.slots} Foto</span>
                  <span className="text-[#FFB020] font-semibold">{frame.usageCount}x</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== KARTU DONASI SAWERIA ==================== */}
      <section
        className={`p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 ${
          isDark ? 'glass-panel-dark' : 'glass-panel-light'
        }`}
      >
        <div className="space-y-3 max-w-xl text-center md:text-left">
          <span className="badge-outline inline-flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>DUKUNG URBOOTH</span>
          </span>
          <h2 className="text-heading">Donasi seikhlasnya via Saweria</h2>
          <p className={`text-[14px] leading-[1.6] ${mutedText}`}>
            Semua fitur photobooth, filter, stiker, dan frame di Urbooth gratis dipakai kapan saja.
            Kalau kamu suka dan ingin bantu web ini makin bagus lagi dengan update frame baru, scan
            QR Saweria di samping ya.
          </p>
          <div className="pt-1 flex justify-center md:justify-start">
            <button
              onClick={() => {
                sound.playClick()
                onOpenDonate()
              }}
              className={`btn-secondary px-5 py-3 text-[14px] flex items-center gap-2 cursor-pointer ${
                isDark ? '' : '!bg-white !text-[#0F0F14] !border-slate-300'
              }`}
            >
              <QrCode className="w-4 h-4 text-[#FFB020]" />
              <span>Perbesar QR Saweria</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick()
            onOpenDonate()
          }}
          title="Klik untuk memperbesar QR Saweria"
          className="shrink-0 p-3.5 rounded-[16px] bg-white border border-slate-200 flex flex-col items-center cursor-pointer transition-transform hover:scale-105"
        >
          <img src="/saweria-qr.png" alt="QR Code Saweria" className="w-36 h-36 object-contain" />
          <span className="mt-1.5 text-[12px] font-semibold text-[#0F0F14]">
            Scan QRIS • Saweria
          </span>
        </button>
      </section>

      {/* ==================== KOTAK SARAN & KRITIK (PALING BAWAH) ==================== */}
      <section
        className={`p-6 sm:p-8 space-y-5 ${
          isDark ? 'glass-panel-dark' : 'glass-panel-light'
        }`}
      >
        <div className="space-y-2 max-w-2xl">
          <span className="badge-outline inline-flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>SARAN & KRITIK</span>
          </span>
          <h2 className="text-heading">Bantu Urbooth jadi makin baik</h2>
          <p className={`text-[14px] leading-[1.6] ${mutedText}`}>
            Punya saran fitur, kritik tampilan, request frame band/tema tertentu, atau menemukan bug?
            Tulis langsung di sini — pesan kamu akan langsung masuk ke panel admin.
          </p>
        </div>

        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold mb-1.5">
                Nama (opsional)
              </label>
              <input
                type="text"
                value={fbName}
                onChange={(e) => setFbName(e.target.value)}
                placeholder="Misal: Diaz atau kosongkan untuk Anonim"
                className={`w-full px-4 py-3 rounded-[16px] border text-[14px] focus:outline-none focus:border-[#FFB020] ${
                  isDark
                    ? 'bg-white/6 border-white/12 text-white placeholder-[#B8B8C4]'
                    : 'bg-white border-slate-300 text-[#0F0F14] placeholder-slate-400'
                }`}
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold mb-1.5">Kategori pesan</label>
              <div className="flex flex-wrap gap-2">
                {(['Saran', 'Kritik', 'Request Frame', 'Bug'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      sound.playClick()
                      setFbCategory(cat)
                    }}
                    className={`px-3.5 py-2.5 rounded-[16px] text-[12px] font-semibold border cursor-pointer transition-colors ${
                      fbCategory === cat
                        ? 'bg-[#FFB020] text-[#0F0F14] border-[#FFB020]'
                        : isDark
                        ? 'bg-white/6 border-white/12 text-[#B8B8C4] hover:text-white'
                        : 'bg-white border-slate-300 text-slate-700 hover:text-[#0F0F14]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold mb-1.5">Penilaian web</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    sound.playClick()
                    setFbRating(num)
                  }}
                  aria-label={`Bintang ${num}`}
                  className="p-1 cursor-pointer transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-5 h-5 ${
                      num <= fbRating
                        ? 'text-[#FFB020] fill-[#FFB020]'
                        : isDark
                        ? 'text-white/20'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
              <span className={`ml-2 text-[12px] font-semibold ${mutedText}`}>
                {fbRating} / 5
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold mb-1.5">
              Pesan saran atau kritik *
            </label>
            <textarea
              required
              rows={3}
              value={fbMessage}
              onChange={(e) => setFbMessage(e.target.value)}
              placeholder="Tulis saran, kritik, atau request frame yang kamu inginkan..."
              className={`w-full px-4 py-3 rounded-[16px] border text-[14px] leading-[1.6] focus:outline-none focus:border-[#FFB020] resize-none ${
                isDark
                  ? 'bg-white/6 border-white/12 text-white placeholder-[#B8B8C4]'
                  : 'bg-white border-slate-300 text-[#0F0F14] placeholder-slate-400'
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {fbSent ? (
              <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-emerald-400">
                <Check className="w-4 h-4" />
                <span>Terima kasih! Pesan kamu sudah terkirim ke admin.</span>
              </span>
            ) : (
              <span className={`text-[12px] ${mutedText}`}>
                Pesan dikirim langsung ke dasbor pengelola Urbooth.
              </span>
            )}

            <button
              type="submit"
              disabled={fbSubmitting || !fbMessage.trim()}
              className={`btn-secondary px-5 py-3 text-[14px] flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                isDark ? '' : '!bg-white !text-[#0F0F14] !border-slate-300'
              }`}
            >
              <Send className="w-4 h-4 text-[#FFB020]" />
              <span>{fbSubmitting ? 'Mengirim...' : 'Kirim saran & kritik'}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
