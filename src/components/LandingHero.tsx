import React, { useState, useRef, useEffect } from 'react'
import {
  Sun,
  Moon,
  Monitor,
  Camera,
  Layers,
  Sliders,
  Video,
  RotateCw,
  ArrowRight,
  Aperture,
  Zap,
  ChevronDown,
} from 'lucide-react'
import type { FrameTemplate, ThemeMode } from '../types'
import { PHOTO_FILTERS } from '../constants/filters'
import { FrameCardPreview } from './FrameCardPreview'
import { sound } from '../utils/sound'

interface LandingHeroProps {
  frames: FrameTemplate[]
  onStart: () => void
  onSelectFrameFromLanding: (frame: FrameTemplate) => void
  onNavigateTab: (tab: 'home' | 'frames' | 'my_frames' | 'gallery') => void
  theme: ThemeMode
  onThemeChange: (t: ThemeMode) => void
  isDark: boolean
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  frames,
  onStart,
  onSelectFrameFromLanding,
  onNavigateTab,
  theme,
  onThemeChange,
  isDark,
}) => {
  // Interactive 3D Camera Rotation State
  const [rotX, setRotX] = useState(-8)
  const [rotY, setRotY] = useState(18)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, startRotX: -8, startRotY: 18 })

  // Automated "sedang foto" live shoot animation cycle on the landing page!
  const [autoShotStep, setAutoShotStep] = useState<number>(3)
  const [flashBurst, setFlashBurst] = useState(false)
  const [stripEjected, setStripEjected] = useState(true)
  const [lensZoom, setLensZoom] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setAutoShotStep((prev) => {
        if (prev > 1) return prev - 1
        // Trigger automated camera shutter flash + eject animation!
        setFlashBurst(true)
        setLensZoom(true)
        setStripEjected(false)
        setTimeout(() => setFlashBurst(false), 300)
        setTimeout(() => setLensZoom(false), 450)
        setTimeout(() => setStripEjected(true), 250)
        return 3
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startRotX: rotX,
      startRotY: rotY,
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    setRotY(dragStartRef.current.startRotY + dx * 0.45)
    setRotX(Math.max(-42, Math.min(42, dragStartRef.current.startRotX - dy * 0.35)))
  }

  const handlePointerUp = () => setIsDragging(false)

  const triggerManual3DShutter = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    sound.playShutter()
    setFlashBurst(true)
    setLensZoom(true)
    setStripEjected(false)
    setTimeout(() => setFlashBurst(false), 320)
    setTimeout(() => setLensZoom(false), 450)
    setTimeout(() => setStripEjected(true), 220)
  }

  const showcaseFrames = frames.slice(0, 4)

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative min-h-screen w-full overflow-y-auto overflow-x-hidden transition-colors duration-300 ${
        isDark ? 'bg-[#0F0F14] text-white' : 'bg-[#FFF4E0] text-[#0F0F14]'
      }`}
    >
      {/* Solid Ambient Orbs Behind Glass Panels (No Gradients!) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="ambient-orb-accent -top-24 -left-24 w-[380px] h-[380px]" />
        <div className="ambient-orb-hover top-1/3 -right-24 w-[400px] h-[400px]" />
        <div className="ambient-orb-accent -bottom-28 left-1/3 w-[360px] h-[360px]" />
      </div>

      {/* ==================== CLEAN GLASS NAVBAR (LOGO APPEARS ONLY ONCE PER SCREEN) ==================== */}
      <header className="sticky top-0 z-40 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <div
          className={`px-4 sm:px-6 py-3 flex items-center justify-between ${
            isDark ? 'glass-panel-dark' : 'glass-panel-light'
          }`}
        >
          {/* Official URBOOTH Logo Box */}
          <div className="logo-box">
            <img src="/urbooth-logo.jpg" alt="Urbooth" className="h-8 w-auto rounded-md" />
          </div>

          <nav className="hidden md:flex items-center space-x-7 text-[14px] font-semibold">
            <button
              onClick={() => {
                sound.playClick()
                onNavigateTab('frames')
              }}
              className="hover:text-[#FFB020] transition-colors cursor-pointer"
            >
              Frame
            </button>
            <button
              onClick={() => {
                sound.playClick()
                onNavigateTab('my_frames')
              }}
              className="hover:text-[#FFB020] transition-colors cursor-pointer"
            >
              Buat Frame
            </button>
            <button
              onClick={() => {
                sound.playClick()
                onNavigateTab('gallery')
              }}
              className="hover:text-[#FFB020] transition-colors cursor-pointer"
            >
              Galeri
            </button>
          </nav>

          <div className="flex items-center space-x-2.5">
            <div
              className={`flex items-center p-1 rounded-[16px] border ${
                isDark ? 'bg-white/6 border-white/12' : 'bg-white border-slate-300'
              }`}
            >
              {(
                [
                  { id: 'light', icon: Sun, title: 'Mode terang' },
                  { id: 'dark', icon: Moon, title: 'Mode gelap' },
                  { id: 'system', icon: Monitor, title: 'Ikuti sistem' },
                ] as const
              ).map((item) => {
                const Icon = item.icon
                const active = theme === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      sound.playClick()
                      onThemeChange(item.id)
                    }}
                    title={item.title}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                      active
                        ? 'bg-[#FFB020] text-[#0F0F14]'
                        : isDark
                        ? 'text-[#B8B8C4] hover:text-white'
                        : 'text-slate-600 hover:text-[#0F0F14]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => {
                sound.playClick()
                onStart()
              }}
              className={`btn-secondary px-4 py-2 text-[14px] cursor-pointer ${
                isDark ? '' : '!bg-white !text-[#0F0F14] !border-slate-300'
              }`}
            >
              Mulai Foto
            </button>
          </div>
        </div>
      </header>

      {/* ==================== SECTION 1: CLEAN HERO + INTERACTIVE 3D CAMERA ==================== */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 min-h-[82vh] flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left 6 Cols: Single Accent Phrase in Hero Title + Single Primary CTA */}
          <div className="lg:col-span-6 space-y-6">
            <span className="badge-outline inline-block">
              {frames.length} FRAME • {PHOTO_FILTERS.length} FILTER
            </span>

            <h1 className="text-hero max-w-[16ch]">
              Abadikan momen seru dalam{' '}
              <span className="text-[#FFB020]">satu klik.</span>
            </h1>

            <p
              className={`text-[16px] leading-[1.6] max-w-lg ${
                isDark ? 'text-[#B8B8C4]' : 'text-slate-600'
              }`}
            >
              Photobooth web interaktif dengan <strong>{frames.length} frame pilihan</strong> (Denim,
              Koran, Apple Music, Viral Meme), <strong>{PHOTO_FILTERS.length} filter foto</strong>,
              stiker meme hapus background otomatis, <strong>Video Frame 30 FPS</strong>, dan{' '}
              <strong>Timelapse</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => {
                  sound.playShutter()
                  onStart()
                }}
                className="btn-primary px-7 py-4 text-[16px] flex items-center space-x-2.5 cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span>Mulai Foto</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  sound.playClick()
                  onNavigateTab('frames')
                }}
                className={`btn-secondary px-6 py-4 text-[14px] flex items-center space-x-2 cursor-pointer ${
                  isDark ? '' : '!bg-white !text-[#0F0F14] !border-slate-300'
                }`}
              >
                <Layers className="w-4 h-4 text-[#FFB020]" />
                <span>Jelajahi {frames.length} frame</span>
              </button>
            </div>
          </div>

          {/* Right 6 Cols: Interactive 3D Camera with Live "Sedang Foto" Shoot Animation! */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div
              onPointerDown={handlePointerDown}
              className="scene-3d w-full h-[380px] flex items-center justify-center cursor-grab active:cursor-grabbing relative"
            >
              {flashBurst && (
                <div className="absolute inset-0 z-50 rounded-3xl bg-white/85 blur-2xl animate-flash pointer-events-none" />
              )}

              <div
                className="preserve-3d relative w-[310px] sm:w-[340px] h-[220px] sm:h-[240px] transition-transform duration-75"
                style={{ transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)` }}
              >
                {/* Live Animated Photo Strip Ejecting from Camera */}
                <div
                  className={`preserve-3d absolute -right-24 top-3 w-24 h-56 rounded-xl p-2 border border-white/40 bg-white shadow-2xl flex flex-col justify-between transition-all duration-500 ${
                    stripEjected ? 'translate-x-8 opacity-100' : '-translate-x-12 opacity-0'
                  }`}
                  style={{ transform: 'translateZ(-14px) rotateZ(7deg)' }}
                >
                  <div className="text-[7px] font-semibold font-bold text-slate-900 text-center">
                    URBOOTH LIVE
                  </div>
                  {[
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=60',
                    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=60',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60',
                  ].map((src, idx) => (
                    <div
                      key={idx}
                      className="w-full h-12 rounded overflow-hidden bg-slate-200"
                    >
                      <img src={src} alt="Live Pose" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="text-[7px] font-semibold text-slate-500 text-center">
                    SHOT COMPLETE
                  </div>
                </div>

                {/* Top 3D Shutter Button */}
                <div
                  onClick={triggerManual3DShutter}
                  title="Klik Shutter 3D!"
                  className="absolute -top-5 right-10 w-14 h-5 rounded-t-lg bg-[#FFB020] border border-white/40 shadow-lg cursor-pointer hover:translate-y-0.5 active:translate-y-1 transition-transform"
                  style={{ transform: 'translateZ(18px)' }}
                />

                {/* Back & Side 3D Walls */}
                <div
                  className="absolute inset-0 rounded-3xl bg-slate-950/90 border border-white/15 shadow-2xl"
                  style={{ transform: 'translateZ(-24px)' }}
                />
                <div
                  className="absolute top-3 bottom-3 -left-6 w-12 rounded-xl bg-slate-900/90 border border-white/20"
                  style={{ transform: 'rotateY(-90deg)' }}
                />
                <div
                  className="absolute top-3 bottom-3 -right-6 w-12 rounded-xl bg-slate-900/90 border border-white/20"
                  style={{ transform: 'rotateY(90deg)' }}
                />

                {/* Front Glassmorphic Camera Body */}
                <div
                  className="absolute inset-0 rounded-3xl bg-[#1A1A22] backdrop-blur-2xl border-2 border-white/25 shadow-[0_25px_70px_rgba(0,0,0,0.5)] p-5 flex flex-col justify-between"
                  style={{ transform: 'translateZ(24px)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span className="font-semibold text-[10px] font-bold text-white/80">
                        SHOOTING... {autoShotStep}
                      </span>
                    </div>
                    <div className="w-14 h-6 rounded-lg bg-white/85 flex items-center justify-center shadow-[0_0_16px_rgba(255,255,255,0.6)]">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-semibold text-white/60">
                    <span>URBOOTH 3D CAM</span>
                    <span>DRAG 360° • CLICK LENS</span>
                  </div>
                </div>

                {/* 3D Telescoping Lens with Live Countdown Indicator */}
                <div
                  onClick={triggerManual3DShutter}
                  className="preserve-3d absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full cursor-pointer group"
                  style={{
                    transform: `translateZ(${lensZoom ? 72 : 52}px)`,
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <div className="w-full h-full rounded-full bg-[#FFB020] border-4 border-white/30 shadow-2xl flex items-center justify-center p-2.5">
                    <div className="w-full h-full rounded-full border-2 border-[#FFB020] flex items-center justify-center p-3">
                      <div className="relative w-full h-full rounded-full bg-[#FFB020] border border-white/25 flex flex-col items-center justify-center overflow-hidden">
                        <Aperture className="w-6 h-6 text-amber-400 mb-0.5 group-hover:rotate-90 transition-transform duration-500" />
                        <span className="font-extrabold font-black text-xs tracking-widest text-white">
                          JEPRET
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`mt-2 px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center space-x-2 ${
                isDark ? 'glass-card-dark text-slate-300' : 'glass-card-light text-slate-700'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5 text-[#FFB020]" />
              <span>Geser untuk putar 3D atau klik lensa untuk jepret</span>
            </div>
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <div className="mt-10 flex justify-center">
          <a
            href="#explore-frames"
            className="flex flex-col items-center space-y-1 text-xs font-bold opacity-60 hover:opacity-100 transition-opacity"
          >
            <span>Scroll untuk Jelajahi</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </a>
        </div>
      </section>

      {/* ==================== SECTION 2: SCROLLABLE INTERACTIVE FRAME SHOWCASE ==================== */}
      <section id="explore-frames" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-semibold font-bold text-[#FFB020] uppercase tracking-widest">
              100+ INTERACTIVE TEMPLATES
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-black mt-1">
              Koleksi Frame Terpopuler
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playClick()
              onNavigateTab('frames')
            }}
            className="text-xs font-bold text-[#FFB020] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua {frames.length} Frame</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {showcaseFrames.map((f) => (
            <div
              key={f.id}
              onClick={() => {
                sound.playClick()
                onSelectFrameFromLanding(f)
              }}
              className={`group rounded-3xl p-3.5 cursor-pointer transition-all hover:-translate-y-1.5 ${
                isDark ? 'glass-card-dark hover:border-[#FFB020]' : 'glass-card-light hover:border-[#FFB020]'
              }`}
            >
              <div
                className={`w-full h-64 rounded-2xl flex items-center justify-center p-3 overflow-hidden ${
                  isDark ? 'bg-slate-950/60' : 'bg-slate-200/60'
                }`}
              >
                <FrameCardPreview
                  frame={f}
                  className="max-h-full w-auto transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="mt-3 px-1">
                <span className="text-[10px] font-semibold text-[#FFB020] font-bold">{f.tag}</span>
                <h3 className="font-bold text-sm truncate">{f.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== SECTION 3: 3 CLEAN WORKFLOW STEPS ==================== */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: Camera,
              step: '01',
              title: 'Jepret atau Upload Foto',
              desc: 'Gunakan webcam dengan timer bersih tanpa blur, atau unggah foto langsung dari galeri perangkatmu.',
            },
            {
              icon: Sliders,
              step: '02',
              title: '108+ Filter & Stiker Meme',
              desc: 'Percantik hasil foto dengan 108 filter warna pro dan tempel stiker meme dengan hapus background otomatis.',
            },
            {
              icon: Video,
              step: '03',
              title: 'Video Frame & Timelapse',
              desc: 'Nikmati animasi live Video Frame bergerak dan Timelapse murni, siap unduh dalam format PNG HD atau WebM.',
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.step}
                className={`p-6 rounded-3xl space-y-3 ${
                  isDark ? 'glass-panel-dark' : 'glass-panel-light'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#FFB020]/15 text-[#FFB020] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-xs font-bold opacity-40">{item.step}</span>
                </div>
                <h3 className="font-extrabold text-base">{item.title}</h3>
                <p className="text-xs leading-relaxed opacity-75">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
