import React, { useState } from 'react'
import {
  Camera,
  Upload,
  Share2,
  ArrowLeft,
  TrendingUp,
  Lock,
  Sparkles,
  Check,
  Layers,
  Newspaper,
  Smile,
  Flame,
  Music,
  Gamepad2,
  Film,
  Shirt,
} from 'lucide-react'
import type { FrameTemplate, FrameThemeType, UserRole } from '../types'
import { FrameCardPreview } from './FrameCardPreview'
import { sound } from '../utils/sound'

interface BrowseFramesProps {
  frames: FrameTemplate[]
  selectedFrame: FrameTemplate
  onSelectFrame: (frame: FrameTemplate) => void
  onStartCameraSession: (frame: FrameTemplate) => void
  onStartUploadSession: (frame: FrameTemplate) => void
  userRole: UserRole
  onLockedClick: (frame: FrameTemplate) => void
  searchQuery: string
  isDark: boolean
  onBackToHome: () => void
  onOpenUploadFrame: () => void
}

type CategoryFilter = 'all' | FrameThemeType

export const BrowseFrames: React.FC<BrowseFramesProps> = ({
  frames,
  selectedFrame,
  onSelectFrame,
  onStartCameraSession,
  onStartUploadSession,
  userRole,
  onLockedClick,
  searchQuery,
  isDark,
  onBackToHome,
  onOpenUploadFrame,
}) => {
  const [activeCat, setActiveCat] = useState<CategoryFilter>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredFrames = frames.filter((f) => {
    const matchesSearch =
      !searchQuery.trim() ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tag.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = activeCat === 'all' || f.themeType === activeCat
    return matchesSearch && matchesCategory
  })

  const handleShare = (frame: FrameTemplate) => {
    sound.playClick()
    navigator.clipboard?.writeText(`${window.location.origin}/frames/${frame.code}`)
    setCopiedId(frame.id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  const isSelectedLocked = userRole === 'guest' && selectedFrame.isLocked

  const categories: { id: CategoryFilter; label: string; icon: typeof Layers }[] = [
    { id: 'all', label: 'Semua Frame', icon: Layers },
    { id: 'denim_street', label: 'Denim & Jeans', icon: Shirt },
    { id: 'newspaper', label: 'Koran & Press', icon: Newspaper },
    { id: 'meme_viral', label: 'Viral Meme', icon: Smile },
    { id: 'special_event', label: 'Special Event', icon: Flame },
    { id: 'band', label: 'Music & Band', icon: Music },
    { id: 'arcade', label: 'Arcade 8-Bit', icon: Gamepad2 },
    { id: 'film', label: 'Analog Film', icon: Film },
  ]

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Category Filter Bar (Vector Icons Only) */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon
            const active = activeCat === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => {
                  sound.playClick()
                  setActiveCat(cat.id)
                }}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#FFB020] text-[#0F0F14] text-white shadow-lg '
                    : isDark
                    ? 'glass-card-dark text-slate-300 hover:text-white'
                    : 'glass-card-light text-slate-700 hover:text-slate-950'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold opacity-65">
            {filteredFrames.length} Template Tersedia
          </span>
          <button
            onClick={() => {
              sound.playClick()
              onOpenUploadFrame()
            }}
            className="px-4 py-2 rounded-2xl bg-[#FFB020] text-[#0F0F14] hover:opacity-95 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg  cursor-pointer transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Frame Sendiri</span>
          </button>
        </div>
      </div>

      {/* Main Glassmorphism Split Preview + Highlighted Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Glassmorphic Featured Detail Panel */}
        <div
          className={`lg:col-span-7 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row gap-6 relative ${
            isDark ? 'glass-panel-dark' : 'glass-panel-light'
          }`}
        >
          {/* Left: Large Frame Visual Preview */}
          <div
            className={`relative w-full md:w-1/2 min-h-[380px] rounded-2xl flex items-center justify-center p-4 ${
              isDark ? 'bg-slate-950/60 border border-white/10' : 'bg-slate-200/60 border border-white'
            }`}
          >
            <button
              onClick={() => {
                sound.playClick()
                onBackToHome()
              }}
              title="Kembali ke Home"
              className={`absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isDark ? 'glass-card-dark text-white' : 'glass-card-light text-slate-800'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleShare(selectedFrame)}
              className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark ? 'glass-card-dark text-white' : 'glass-card-light text-slate-800'
              }`}
            >
              {copiedId === selectedFrame.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>

            <FrameCardPreview
              frame={selectedFrame}
              className="max-h-[360px] w-auto drop-shadow-2xl"
            />
          </div>

          {/* Right: Frame Info & Start Buttons */}
          <div className="w-full md:w-1/2 flex flex-col justify-between py-1">
            <div className="space-y-3">
              <div className="flex items-center flex-wrap gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/30 text-[10px] font-extrabold tracking-wider uppercase">
                  {selectedFrame.tag}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    isDark ? 'glass-card-dark text-slate-300' : 'glass-card-light text-slate-700'
                  }`}
                >
                  {selectedFrame.layoutLabel}
                </span>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight">
                {selectedFrame.name}
              </h2>

              <p className="text-xs font-semibold opacity-65">
                {selectedFrame.dimensionsLabel} • {selectedFrame.slots} photos •{' '}
                {selectedFrame.usageCount} times
              </p>

              <div className="flex items-center space-x-2.5 pt-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFB020] text-[#0F0F14] flex items-center justify-center text-white text-xs font-bold shadow">
                  {selectedFrame.creatorName[0]}
                </div>
                <div>
                  <p className="text-[10px] opacity-60">Created by</p>
                  <p className="text-xs font-bold">{selectedFrame.creatorName}</p>
                </div>
              </div>

              <p className="text-xs leading-relaxed pt-2 opacity-80">
                {selectedFrame.description}
              </p>
            </div>

            <div className="space-y-2.5 pt-6 mt-6 border-t border-white/10">
              {isSelectedLocked ? (
                <button
                  onClick={() => {
                    sound.playClick()
                    onLockedClick(selectedFrame)
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#FFB020] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg cursor-pointer transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>Login untuk Membuka Frame PRO Ini</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      sound.playClick()
                      onStartCameraSession(selectedFrame)
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#FFB020] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg  cursor-pointer transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Start Photo Session</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick()
                      onStartUploadSession(selectedFrame)
                    }}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                      isDark
                        ? 'glass-card-dark hover:bg-white/10 text-white'
                        : 'glass-card-light hover:bg-white text-slate-900'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Start from Upload</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: 2 Highlighted Vertical Frame Cards */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          {filteredFrames.slice(0, 2).map((frame) => {
            const isSelected = frame.id === selectedFrame.id
            const isLocked = userRole === 'guest' && frame.isLocked
            return (
              <div
                key={frame.id}
                onClick={() => {
                  sound.playClick()
                  onSelectFrame(frame)
                }}
                className={`group rounded-3xl p-3 cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-[#FFB020] glass-panel-dark'
                    : isDark
                    ? 'glass-card-dark hover:border-white/25'
                    : 'glass-card-light hover:border-slate-300'
                }`}
              >
                <div
                  className={`relative w-full h-80 rounded-2xl flex items-center justify-center p-3 overflow-hidden ${
                    isDark ? 'bg-slate-950/60' : 'bg-slate-200/60'
                  }`}
                >
                  {isLocked && (
                    <span className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-extrabold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> PRO
                    </span>
                  )}
                  <FrameCardPreview
                    frame={frame}
                    className="max-h-full w-auto transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="mt-3 px-1">
                  <h4 className="font-bold text-sm truncate">{frame.name}</h4>
                  <p className="text-[11px] truncate opacity-65">by {frame.creatorName}</p>
                  <div className="flex items-center justify-between mt-2 text-[11px]">
                    <span className="opacity-60">{frame.tag}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {frame.usageCount}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom Full Grid of All Frames */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
        {filteredFrames.map((frame) => {
          const isSelected = frame.id === selectedFrame.id
          const isLocked = userRole === 'guest' && frame.isLocked
          return (
            <div
              key={frame.id}
              onClick={() => {
                sound.playClick()
                onSelectFrame(frame)
              }}
              className={`group rounded-3xl p-3 cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between ${
                isSelected
                  ? 'ring-2 ring-[#FFB020] shadow-xl'
                  : isDark
                  ? 'glass-card-dark hover:border-white/25'
                  : 'glass-card-light hover:border-slate-300'
              }`}
            >
              <div
                className={`relative w-full h-64 rounded-2xl flex items-center justify-center p-2.5 overflow-hidden ${
                  isDark ? 'bg-slate-950/60' : 'bg-slate-200/60'
                }`}
              >
                {frame.badgeText && (
                  <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full bg-[#FFB020] text-[#0F0F14] text-[9px] font-extrabold">
                    {frame.badgeText}
                  </span>
                )}
                {isLocked && (
                  <span className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-extrabold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> PRO
                  </span>
                )}
                <FrameCardPreview
                  frame={frame}
                  className="max-h-full w-auto transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="mt-3 px-1">
                <h4 className="font-bold text-xs sm:text-sm truncate">{frame.name}</h4>
                <p className="text-[11px] truncate opacity-65">by {frame.creatorName}</p>
                <div className="flex items-center justify-between mt-1.5 text-[10px]">
                  <span className="opacity-60">{frame.layoutLabel}</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    {frame.usageCount}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
