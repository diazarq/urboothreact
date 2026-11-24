import React, { useState } from 'react'
import { Archive, Plus, Image as ImageIcon } from 'lucide-react'
import type { PhotoSession } from '../types'
import { sound } from '../utils/sound'
import { LightboxModal } from './LightboxModal'

interface ArchiveGalleryProps {
  photos: PhotoSession[]
  isDark: boolean
  onNewSession: () => void
  onDeletePhoto: (id: string) => void
}

export const ArchiveGallery: React.FC<ArchiveGalleryProps> = ({
  photos,
  isDark,
  onNewSession,
  onDeletePhoto,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoSession | null>(null)

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800/40 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#FFB020] mb-1">
            <Archive className="w-3.5 h-3.5" />
            <span>GALERI LOKAL URBOOTH</span>
            <span>•</span>
            <span>{photos.length} HASIL FOTO</span>
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
          className="px-5 py-3 bg-[#FFB020] hover:bg-[#F28C1B] text-[#0F0F14] font-bold text-xs uppercase tracking-wider flex items-center space-x-2 rounded-xl shadow-lg  cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Mulai Sesi Foto Baru</span>
        </button>
      </div>

      {photos.length === 0 ? (
        <div
          className={`py-20 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center p-6 ${
            isDark ? 'bg-[#17171D]/60 border-zinc-800' : 'bg-white border-zinc-300'
          }`}
        >
          <div className="w-14 h-14 bg-[#FFB020]/15 border border-[#FFB020]/30 flex items-center justify-center mb-3 rounded-2xl">
            <ImageIcon className="w-6 h-6 text-[#FFB020]" />
          </div>
          <h3 className={`font-extrabold text-lg mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            Belum Ada Foto Tersimpan
          </h3>
          <p className={`text-sm max-w-md mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Pilih frame favoritmu di menu Frame dan abadikan momen seru bersama teman-temanmu!
          </p>
          <button
            onClick={() => {
              sound.playClick()
              onNewSession()
            }}
            className="px-6 py-3 bg-[#FFB020] text-[#0F0F14] hover:bg-[#F28C1B] font-bold text-xs uppercase tracking-wider flex items-center space-x-2 rounded-xl cursor-pointer transition-all"
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
                  ? 'bg-[#17171D] border-zinc-800 hover:border-[#FFB020]'
                  : 'bg-white border-zinc-200 hover:border-[#FFB020] shadow-xs'
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
                <div className="flex items-center justify-between text-xs font-semibold text-[#FFB020] mb-1">
                  <span>#{session.id.slice(-6).toUpperCase()}</span>
                  <span>{session.shots.length} FOTO</span>
                </div>

                <h4
                  className={`font-bold text-sm truncate ${
                    isDark ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  {session.frameName}
                </h4>

                <div
                  className={`flex items-center justify-between text-xs pt-2 mt-2 border-t ${
                    isDark
                      ? 'border-zinc-800 text-slate-300'
                      : 'border-zinc-100 text-slate-600'
                  }`}
                >
                  <span>
                    {new Date(session.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-[#FFB020] font-bold group-hover:underline">Buka →</span>
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
