import React, { useState } from 'react'
import { Lock, Check, Sparkles } from 'lucide-react'
import type { FrameCategory, FrameTemplate, UserRole } from '../types'
import { FRAME_TEMPLATES } from '../constants/frames'
import { sound } from '../utils/sound'

interface FrameSelectorProps {
  selectedFrame: FrameTemplate
  onSelectFrame: (frame: FrameTemplate) => void
  userRole: UserRole
  onLockedClick: (frame: FrameTemplate) => void
}

type FilterTab = 'all' | 'cartoon' | 'band' | 'classic' | FrameCategory

export const FrameSelector: React.FC<FrameSelectorProps> = ({
  selectedFrame,
  onSelectFrame,
  userRole,
  onLockedClick,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const filteredFrames = FRAME_TEMPLATES.filter((frame) => {
    if (activeTab === 'all') return true
    if (activeTab === 'cartoon' || activeTab === 'band' || activeTab === 'classic') {
      return frame.themeType === activeTab
    }
    return frame.category === activeTab
  })

  const isGuest = userRole === 'guest'

  return (
    <div className="w-full">
      {/* Category Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D8D5CE] pb-3 mb-4 gap-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#FFB020]" />
          <h3 className="font-semibold text-xl font-bold text-[#181818]">
            Choose Frame Style
          </h3>
          <span className="text-[11px] font-semibold text-[#737069]">
            ({FRAME_TEMPLATES.length} EDITIONS)
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center flex-wrap gap-1 bg-[#EFECE6] p-1 border border-[#D8D5CE] rounded-lg">
          {(
            [
              { id: 'all', label: 'ALL FRAMES' },
              { id: 'cartoon', label: '🐾 CUTE CARTOON' },
              { id: 'band', label: '🎸 ROCK BAND' },
              { id: 'classic', label: '✨ SIGNATURE' },
              { id: 'strip_1x4', label: '1x4 STRIP' },
              { id: 'grid_2x2', label: '2x2 GRID' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick()
                setActiveTab(tab.id as FilterTab)
              }}
              className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all rounded-md cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#181818] text-[#F7F6F2] font-semibold'
                  : 'text-[#66645E] hover:text-[#181818] hover:bg-[#E5E1D8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frame Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {filteredFrames.map((frame) => {
          const isSelected = selectedFrame.id === frame.id
          const isLockedForUser = isGuest && frame.isLocked

          return (
            <div
              key={frame.id}
              onClick={() => {
                if (isLockedForUser) {
                  sound.playClick()
                  onLockedClick(frame)
                } else {
                  sound.playClick()
                  onSelectFrame(frame)
                }
              }}
              className={`group relative p-3.5 border transition-all cursor-pointer flex flex-col justify-between rounded-lg ${
                isSelected
                  ? 'border-[#181818] bg-[#FAF9F6] shadow-md ring-1 ring-[#181818]'
                  : 'border-[#D8D5CE] bg-[#FAF9F6] hover:border-[#8C8983] hover:bg-[#FFFFFF]'
              }`}
            >
              {/* Header Info */}
              <div className="flex items-start justify-between mb-2.5">
                <div>
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="font-semibold text-[9px] px-1.5 py-0.5 border border-[#D8D5CE] bg-[#EFECE6] text-[#181818] rounded-sm">
                      {frame.code}
                    </span>
                    <span className="text-[10px] font-semibold text-[#737069]">
                      {frame.themeType === 'cartoon' ? '🐾 CARTOON' : frame.themeType === 'band' ? '🎸 ROCK BAND' : '✨ SIGNATURE'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-lg text-[#181818] tracking-tight group-hover:text-black">
                    {frame.name}
                  </h4>
                </div>

                {/* Status Badges */}
                <div>
                  {isLockedForUser ? (
                    <div className="flex items-center space-x-1 text-[9px] font-semibold px-2 py-0.5 bg-[#EFECE6] border border-[#D8D5CE] text-[#8C5228] rounded-full">
                      <Lock className="w-2.5 h-2.5" />
                      <span>LOCKED</span>
                    </div>
                  ) : isSelected ? (
                    <div className="flex items-center space-x-1 text-[9px] font-semibold px-2 py-0.5 bg-[#181818] text-[#F7F6F2] rounded-full">
                      <Check className="w-2.5 h-2.5" />
                      <span>ACTIVE</span>
                    </div>
                  ) : (
                    <div className="text-[9px] font-semibold text-[#737069]">
                      {frame.slots} CUTS
                    </div>
                  )}
                </div>
              </div>

              {/* Physical Frame Mini Visualizer */}
              <div
                className="w-full p-3 border mb-3 flex flex-col items-center justify-center transition-transform group-hover:scale-[1.01] rounded-md relative overflow-hidden"
                style={{
                  backgroundColor: frame.bgColor,
                  borderColor: frame.subtleBorderColor,
                }}
              >
                {/* Visual Doodles on Preview */}
                <div className="w-full flex items-center justify-between text-[11px] mb-1 px-1">
                  <span className="font-semibold font-bold text-xs" style={{ color: frame.textColor }}>
                    urbooth
                  </span>
                  <span className="text-[10px]">
                    {frame.illustration === 'cute_bunny' ? '🐰✨' : frame.illustration === 'cat_doodles' ? '🐱🐾' : frame.illustration === 'rock_band' ? '⚡🎸' : '♡'}
                  </span>
                </div>

                {frame.category === 'grid_2x2' ? (
                  <div className="grid grid-cols-2 gap-1.5 w-24 h-24 p-1">
                    {[1, 2, 3, 4].map((s) => (
                      <div
                        key={s}
                        className="w-full h-full border border-current opacity-40 flex items-center justify-center rounded-xs"
                        style={{ color: frame.textColor }}
                      >
                        <span className="font-semibold text-[7px] font-bold">0{s}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`flex flex-col gap-1 p-1 ${
                      frame.slots === 4 ? 'w-16 h-28' : 'w-16 h-24'
                    }`}
                  >
                    {Array.from({ length: frame.slots }).map((_, s) => (
                      <div
                        key={s}
                        className="w-full flex-1 border border-current opacity-40 flex items-center justify-center rounded-xs"
                        style={{ color: frame.textColor }}
                      >
                        <span className="font-semibold text-[7px] font-bold">0{s + 1}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="w-full text-center mt-1">
                  <span className="font-semibold text-[11px] truncate block" style={{ color: frame.textColor }}>
                    {frame.defaultVenue.split('•')[0]}
                  </span>
                </div>
              </div>

              {/* Description & Action footer */}
              <div className="pt-2 border-t border-[#EFECE6] flex items-center justify-between text-[10px] font-semibold text-[#737069]">
                <span className="truncate pr-2">{frame.description}</span>
                {isLockedForUser ? (
                  <span className="text-[#8C5228] font-bold shrink-0 hover:underline">
                    Unlock →
                  </span>
                ) : (
                  <span className="text-[#181818] shrink-0 font-medium">Select →</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
