import React from 'react'
import { Camera, Archive, Lock, Unlock, LogOut, Sparkles, Heart } from 'lucide-react'
import type { User } from '../types'
import { sound } from '../utils/sound'

interface NavbarProps {
  currentView: 'studio' | 'archive'
  onViewChange: (view: 'studio' | 'archive') => void
  user: User
  onOpenAuth: () => void
  onLogout: () => void
  photoCount: number
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  user,
  onOpenAuth,
  onLogout,
  photoCount,
}) => {
  const isMember = user.role === 'member'

  return (
    <header className="sticky top-0 z-40 bg-[#F7F6F2]/90 backdrop-blur-md border-b border-[#D8D5CE] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div
            onClick={() => {
              sound.playClick()
              onViewChange('studio')
            }}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 bg-[#181818] rounded-xl flex items-center justify-center text-[#F7F6F2] transition-transform duration-200 group-hover:scale-95 shadow-xs">
              <Camera className="w-4 h-4 text-[#FFE4E6]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-handflair text-2xl font-bold tracking-tight text-[#181818]">
                  urbooth
                </span>
                <Heart className="w-3 h-3 text-pink-500 fill-pink-500 animate-pulse" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#737069] px-1.5 py-0.5 border border-[#D8D5CE] bg-[#EFECE6] rounded-sm">
                  CARTOON & ROCK BAND
                </span>
              </div>
              <p className="font-mono text-[10px] text-[#737069] hidden sm:block">
                CUTE DOODLES & ROCK BAND PHOTO STRIPS
              </p>
            </div>
          </div>
        </div>

        {/* Center View Switcher */}
        <nav className="flex items-center border border-[#D8D5CE] bg-[#EFECE6] p-0.5 rounded-md">
          <button
            onClick={() => {
              sound.playClick()
              onViewChange('studio')
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all rounded-sm ${
              currentView === 'studio'
                ? 'bg-[#181818] text-[#F7F6F2]'
                : 'text-[#66645E] hover:text-[#181818] hover:bg-[#E5E1D8]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>

          <button
            onClick={() => {
              sound.playClick()
              onViewChange('archive')
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all rounded-sm relative ${
              currentView === 'archive'
                ? 'bg-[#181818] text-[#F7F6F2]'
                : 'text-[#66645E] hover:text-[#181818] hover:bg-[#E5E1D8]'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archive</span>
            {photoCount > 0 && (
              <span
                className={`ml-1 text-[9px] px-1 font-mono rounded-full ${
                  currentView === 'archive' ? 'bg-[#3A3835] text-[#F7F6F2]' : 'bg-[#D8D5CE] text-[#181818]'
                }`}
              >
                {photoCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Auth / Status pill */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {isMember ? (
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center space-x-1.5 border border-[#D8D5CE] bg-[#FAF9F6] px-2.5 py-1 text-xs font-mono rounded-md">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse" />
                <span className="text-[#181818] font-medium">{user.name || user.email.split('@')[0]}</span>
                <span className="text-[#8C8983]">•</span>
                <span className="text-[10px] text-[#55534E] flex items-center gap-1">
                  <Unlock className="w-2.5 h-2.5 text-emerald-600" />
                  MEMBER
                </span>
              </div>
              <button
                onClick={() => {
                  sound.playClick()
                  onLogout()
                }}
                title="Logout"
                className="px-2.5 py-1 border border-[#D8D5CE] bg-[#EFECE6] hover:bg-[#181818] hover:text-[#F7F6F2] hover:border-[#181818] text-xs font-mono uppercase tracking-wider flex items-center space-x-1 transition-all rounded-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center space-x-1.5 border border-[#D8D5CE] bg-[#EFECE6] px-2.5 py-1 text-xs font-mono text-[#737069] rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
                <span>GUEST MODE</span>
                <span className="text-[#8C8983]">•</span>
                <span className="text-[10px] flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> 5 FREE FRAMES
                </span>
              </div>
              <button
                onClick={() => {
                  sound.playClick()
                  onOpenAuth()
                }}
                className="px-3 py-1.5 bg-[#181818] text-[#F7F6F2] hover:bg-[#383838] text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-none rounded-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Unlock All Frames</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
