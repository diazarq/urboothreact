import React from 'react'
import {
  ArrowRight,
  Users,
  Clock,
  Sparkles,
  Lock,
  Camera,
  Upload,
  Palette,
  FolderHeart,
  Aperture,
} from 'lucide-react'
import type { FrameTemplate, User } from '../types'
import { FrameCardPreview } from './FrameCardPreview'
import { sound } from '../utils/sound'

interface HomeDashboardProps {
  frames: FrameTemplate[]
  user: User
  isDark: boolean
  onStartPhotobooth: (frame?: FrameTemplate) => void
  onStartUpload: (frame?: FrameTemplate) => void
  onNavigateTab: (tab: 'frames' | 'my_frames' | 'events' | 'studio') => void
  onSelectFrameDetail: (frame: FrameTemplate) => void
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  frames,
  user,
  isDark,
  onStartPhotobooth,
  onStartUpload,
  onNavigateTab,
  onSelectFrameDetail,
}) => {
  const duoFrame = frames.find((f) => f.cols === 2) || frames[0]
  const jeansFrame = frames.find((f) => f.illustration === 'denim_jeans') || frames[1]
  const koranFrame = frames.find((f) => f.illustration === 'newspaper_press') || frames[2]

  const actionCards = [
    {
      id: 'photobooth',
      title: 'Photobooth Studio',
      subtitle: 'Live camera + Video Frame',
      icon: Camera,
      accentGrad: 'from-pink-500/30 via-purple-500/20 to-indigo-500/30',
      iconColor: 'text-pink-400',
      onClick: () => onStartPhotobooth(frames[0]),
    },
    {
      id: 'duo',
      title: 'Meme & Duo Grid',
      subtitle: '2x3 grid + Meme Stickers',
      icon: Users,
      accentGrad: 'from-rose-500/30 via-pink-500/20 to-amber-500/30',
      iconColor: 'text-rose-400',
      onClick: () => onStartPhotobooth(duoFrame),
    },
    {
      id: 'upload',
      title: 'Upload Gallery',
      subtitle: 'Import foto dari perangkat',
      icon: Upload,
      accentGrad: 'from-emerald-500/30 via-teal-500/20 to-cyan-500/30',
      iconColor: 'text-emerald-400',
      onClick: () => onStartUpload(frames[0]),
    },
    {
      id: 'jeans_koran',
      title: 'Denim & Koran',
      subtitle: 'Jeans 501 & Daily Press',
      icon: Aperture,
      accentGrad: 'from-blue-500/30 via-indigo-500/20 to-amber-500/30',
      iconColor: 'text-amber-400',
      onClick: () => onSelectFrameDetail(jeansFrame),
    },
    {
      id: 'create_frame',
      title: 'Create Frame',
      subtitle: 'Desain frame kustom',
      icon: Palette,
      accentGrad: 'from-amber-500/30 via-orange-500/20 to-yellow-500/30',
      iconColor: 'text-amber-300',
      onClick: () => onNavigateTab('my_frames'),
    },
    {
      id: 'my_frames',
      title: 'Frame Kita',
      subtitle: user.role === 'member' ? 'Koleksi frame pribadi' : 'Wajib login member',
      icon: FolderHeart,
      accentGrad: 'from-cyan-500/30 via-sky-500/20 to-blue-500/30',
      iconColor: 'text-cyan-400',
      onClick: () => onNavigateTab('my_frames'),
    },
  ]

  const featuredCollections = [
    {
      id: 'col_1',
      title: 'Raw Indigo Denim 501 & Y2K Patchwork',
      author: 'Denim Atelier ID',
      tag: 'DENIM COLLECTION',
      stats: '945 USED',
      participants: 128,
      bannerBg: 'from-blue-900/80 via-indigo-900/75 to-amber-700/70',
      frame: jeansFrame,
    },
    {
      id: 'col_2',
      title: 'The Urbooth Daily Press — Headline Koran',
      author: 'Editorial Press Gazette',
      tag: 'NEWSPAPER EDITION',
      stats: '1,120 USED',
      participants: 215,
      bannerBg: 'from-stone-800/85 via-neutral-800/80 to-amber-900/75',
      frame: koranFrame,
    },
  ]

  return (
    <div className="w-full space-y-10 pb-12">
      {/* Top Glass Hero Welcome */}
      <div
        className={`rounded-3xl p-6 sm:p-8 relative overflow-hidden ${
          isDark ? 'glass-panel-dark' : 'glass-panel-light'
        }`}
      >
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EC4899]/15 text-[#EC4899] text-[11px] font-extrabold tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>GLASSMORPHISM STUDIO • 108+ PRO FILTERS</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight">
            Ready to capture your moments?
          </h1>
          <p className="text-xs sm:text-sm opacity-75 mt-1.5">
            Pilih mode pengambilan foto, eksplorasi frame Jeans, Koran & Meme, atau buat frame
            kamu sendiri.
          </p>
        </div>

        {/* 6 Glassmorphic Action Cards */}
        <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {actionCards.map((card) => {
            const Icon = card.icon
            return (
              <button
                key={card.id}
                onClick={() => {
                  sound.playClick()
                  card.onClick()
                }}
                className={`group p-3.5 rounded-2xl text-left transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between cursor-pointer ${
                  isDark
                    ? 'glass-card-dark hover:border-pink-500/50'
                    : 'glass-card-light hover:border-pink-500/50'
                }`}
              >
                <div
                  className={`w-full h-24 rounded-xl bg-gradient-to-br ${card.accentGrad} border border-white/15 flex items-center justify-center mb-3 transition-transform group-hover:scale-[1.03]`}
                >
                  <Icon className={`w-10 h-10 ${card.iconColor} drop-shadow`} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs sm:text-sm leading-tight">
                      {card.title}
                    </h3>
                    {card.id === 'my_frames' && user.role === 'guest' && (
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] opacity-65 mt-0.5 leading-snug">
                    {card.subtitle}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Featured Frame Collections (Jeans & Newspaper Koran) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">
            Featured Collections (Denim Jeans & Koran)
          </h2>
          <button
            onClick={() => {
              sound.playClick()
              onNavigateTab('frames')
            }}
            className="text-xs font-bold text-[#EC4899] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua Frame</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
              className={`group rounded-3xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 ${
                isDark ? 'glass-card-dark' : 'glass-card-light'
              }`}
            >
              <div
                className={`relative h-44 w-full bg-gradient-to-br ${ev.bannerBg} p-6 flex items-center justify-between overflow-hidden`}
              >
                <div className="z-10 max-w-xs space-y-2">
                  <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase">
                    {ev.tag}
                  </span>
                  <h3 className="font-display font-black text-white text-xl sm:text-2xl leading-tight">
                    {ev.title}
                  </h3>
                </div>

                <div className="z-10 h-36">
                  <FrameCardPreview
                    frame={ev.frame}
                    className="h-full w-auto rounded shadow-2xl rotate-3 group-hover:rotate-0 transition-transform"
                  />
                </div>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-amber-400 flex items-center justify-center text-[10px] font-bold text-white">
                    {ev.author[0]}
                  </div>
                  <span className="text-xs font-semibold opacity-80">{ev.author}</span>
                </div>

                <div className="flex items-center space-x-3 text-[11px] font-mono">
                  <span className="text-[#EC4899] flex items-center gap-1 font-semibold">
                    <Clock className="w-3 h-3" />
                    {ev.stats}
                  </span>
                  <span className="flex items-center gap-1 opacity-70">
                    <Users className="w-3 h-3" />
                    {ev.participants}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newest Frames Row */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold">Newest Frames</h2>
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#EC4899]/15 text-[#EC4899]">
              {frames.length} TEMPLATES
            </span>
          </div>
          <button
            onClick={() => {
              sound.playClick()
              onNavigateTab('frames')
            }}
            className="text-xs font-bold text-[#EC4899] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Browse All Frames</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
              className={`group relative rounded-3xl p-2.5 cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between ${
                isDark
                  ? 'glass-card-dark hover:border-[#EC4899]/60'
                  : 'glass-card-light hover:border-[#EC4899]'
              }`}
            >
              <span className="absolute top-4 right-4 z-10 px-2 py-0.5 rounded-full bg-[#EC4899] text-white text-[9px] font-extrabold tracking-wider uppercase shadow">
                {frame.badgeText || 'NEW'}
              </span>

              <div
                className={`w-full h-52 rounded-2xl flex items-center justify-center p-2 overflow-hidden ${
                  isDark ? 'bg-slate-950/60' : 'bg-slate-200/60'
                }`}
              >
                <FrameCardPreview
                  frame={frame}
                  className="max-h-full w-auto transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="mt-2.5 px-1">
                <h4 className="font-bold text-xs truncate">{frame.name}</h4>
                <div className="flex items-center justify-between text-[10px] mt-1">
                  <span className="opacity-65">
                    by {frame.creatorName.split(' ')[0]}
                  </span>
                  <span className="text-emerald-400 font-mono flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    {frame.usageCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
