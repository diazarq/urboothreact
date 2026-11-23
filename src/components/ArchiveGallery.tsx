import React, { useState } from 'react'
import { Archive, Plus, Lock, Sparkles, Image as ImageIcon } from 'lucide-react'
import type { PhotoSession, User } from '../types'
import { sound } from '../utils/sound'
import { LightboxModal } from './LightboxModal'

interface ArchiveGalleryProps {
  photos: PhotoSession[]
  user: User
  isDark: boolean
  onOpenAuth: () => void
  onNewSession: () => void
  onDeletePhoto: (id: string) => void
}

export const ArchiveGallery: React.FC<ArchiveGalleryProps> = ({
  photos,
  user,
  isDark,
  onOpenAuth,
  onNewSession,
  onDeletePhoto,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoSession | null>(null)
  const isMember = user.role === 'member'

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800/40 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[#EC4899] mb-1">
            <Archive className="w-3.5 h-3.5" />
            <span>URBOOTH CLOUD GALLERY</span>
            <span>•</span>
            <span>{photos.length} PHOTO STRIPS</span>
          </div>
          <h1
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-zinc-900'
            }`}
          >
            Galeri & Riwayat Foto Kamu
          </h1>
        </div>

        <button
          onClick={() => {
            sound.playClick()
            onNewSession()
          }}
          className="px-5 py-2.5 bg-[#EC4899] hover:bg-[#DB2777] text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-2 rounded-xl shadow-lg shadow-[#EC4899]/20 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Mulai Sesi Foto Baru</span>
        </button>
      </div>

      {!isMember && (
        <div
          className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isDark ? 'bg-[#17171D] border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'
          }`}
        >
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 bg-[#EC4899]/15 border border-[#EC4899]/30 flex items-center justify-center shrink-0 rounded-xl">
              <Lock className="w-5 h-5 text-[#EC4899]" />
            </div>
            <div>
              <h3 className={`font-bold text-base mb-0.5 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                Login untuk Menyimpan Riwayat Foto & Melihat Frame Kita
              </h3>
              <p className={`text-xs max-w-xl leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Dalam Mode Tamu (Guest), kamu tetap bisa download foto langsung ke perangkat, tetapi
                riwayat foto tidak disimpan ke akun. Masuk sekarang untuk menyimpan semua momenmu!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick()
              onOpenAuth()
            }}
            className="px-5 py-2.5 bg-[#EC4899] text-white hover:bg-[#DB2777] font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shrink-0 rounded-xl cursor-pointer transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Masuk Sekarang</span>
          </button>
        </div>
      )}

      {photos.length === 0 ? (
        <div
          className={`py-20 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center p-6 ${
            isDark ? 'bg-[#17171D]/60 border-zinc-800' : 'bg-white border-zinc-300'
          }`}
        >
          <div className="w-14 h-14 bg-[#EC4899]/15 border border-[#EC4899]/30 flex items-center justify-center mb-3 rounded-2xl">
            <ImageIcon className="w-6 h-6 text-[#EC4899]" />
          </div>
          <h3 className={`font-extrabold text-lg mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            Belum Ada Foto Tersimpan
          </h3>
          <p className={`text-xs max-w-md mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Pilih frame favoritmu di menu Frames dan abadikan momen seru bersama teman-temanmu!
          </p>
          <button
            onClick={() => {
              sound.playClick()
              onNewSession()
            }}
            className="px-6 py-3 bg-[#EC4899] text-white hover:bg-[#DB2777] font-bold text-xs uppercase tracking-wider flex items-center space-x-2 rounded-xl cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Mulai Photobooth</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {photos.map((session) => (
            <div
              key={session.id}
              onClick={() => {
                sound.playClick()
                setSelectedPhoto(session)
              }}
              className={`group rounded-2xl border p-3 transition-all cursor-pointer flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? 'bg-[#17171D] border-zinc-800 hover:border-[#EC4899]'
                  : 'bg-white border-zinc-200 hover:border-[#EC4899] shadow-xs'
              }`}
            >
              <div
                className={`w-full rounded-xl p-3 flex items-center justify-center min-h-[260px] overflow-hidden mb-3 ${
                  isDark ? 'bg-[#111115]' : 'bg-zinc-100'
                }`}
              >
                <img
                  src={session.compositeDataUrl}
                  alt={session.frameName}
                  className="max-h-[240px] w-auto object-contain transition-transform group-hover:scale-105"
                />
              </div>

              <div className="px-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#EC4899] mb-1">
                  <span>#{session.id.slice(-6).toUpperCase()}</span>
                  <span>{session.shots.length} PHOTOS</span>
                </div>

                <h4
                  className={`font-bold text-sm truncate ${
                    isDark ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  {session.frameName}
                </h4>

                <div
                  className={`flex items-center justify-between text-[11px] pt-2 mt-2 border-t ${
                    isDark
                      ? 'border-zinc-800 text-zinc-400'
                      : 'border-zinc-100 text-zinc-500'
                  }`}
                >
                  <span>
                    {new Date(session.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-[#EC4899] font-bold group-hover:underline">
                    Buka →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <LightboxModal
        session={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onDelete={onDeletePhoto}
      />
    </div>
  )
}
