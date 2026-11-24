import React from 'react'
import { X, Download, Trash2, Heart } from 'lucide-react'
import type { PhotoSession } from '../types'
import { sound } from '../utils/sound'

interface LightboxModalProps {
  session: PhotoSession | null
  onClose: () => void
  onDelete: (id: string) => void
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  session,
  onClose,
  onDelete,
}) => {
  if (!session) return null

  const handleDownload = () => {
    sound.playShutter()
    const link = document.createElement('a')
    link.download = `urbooth_${session.frameName.replace(/\s+/g, '_')}_${session.id}.png`
    link.href = session.compositeDataUrl
    link.click()
  }

  const handleDelete = () => {
    if (window.confirm('Delete this photo strip from your vault?')) {
      sound.playClick()
      onDelete(session.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#181818]/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#FAF9F6] border border-[#D8D5CE] shadow-2xl flex flex-col md:flex-row max-h-[92vh] overflow-hidden rounded-xl">
        <button
          onClick={() => {
            sound.playClick()
            onClose()
          }}
          className="absolute top-4 right-4 z-20 p-2 text-[#737069] hover:text-[#181818] bg-[#FAF9F6] border border-[#D8D5CE] hover:bg-[#EFECE6] transition-all cursor-pointer rounded-md"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-full md:w-3/5 bg-[#EAE6DF] p-6 sm:p-10 flex items-center justify-center overflow-y-auto">
          <img
            src={session.compositeDataUrl}
            alt={session.frameName}
            className="max-h-[75vh] w-auto shadow-xl border border-[#D8D5CE] object-contain rounded-sm"
          />
        </div>

        <div className="w-full md:w-2/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-[#FAF9F6] border-t md:border-t-0 md:border-l border-[#D8D5CE]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#737069] mb-2">
              <span className="w-2 h-2 rounded-full text-[#FFB020] inline-block" />
              <span>URBOOTH MEMORY CARD</span>
            </div>

            <h3 className="text-2xl font-semibold font-bold text-[#181818] mb-1 flex items-center gap-1.5">
              {session.frameName}
              <Heart className="w-4 h-4 text-[#FFB020] fill-[#FFB020]" />
            </h3>

            <p className="font-semibold text-xs text-[#737069] mb-6">
              SERIAL: #{session.id.slice(-8).toUpperCase()}
            </p>

            <div className="space-y-3.5 border-t border-b border-[#D8D5CE] py-4 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <span className="text-[#737069]">CAPTURED DATE:</span>
                <span className="text-[#181818] font-medium">
                  {new Date(session.createdAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#737069]">VENUE IMPRINT:</span>
                <span className="text-[#181818] font-medium truncate max-w-[180px]">
                  {session.venue}
                </span>
              </div>

              {session.caption && (
                <div className="flex items-center justify-between">
                  <span className="text-[#737069]">NOTE:</span>
                  <span className="text-[#181818] font-medium italic">
                    "{session.caption}"
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[#737069]">COLOR FILTER:</span>
                <span className="text-[#181818] font-medium uppercase">
                  {session.filterId}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#737069]">TOTAL CUTS:</span>
                <span className="text-[#181818] font-medium">
                  {session.shots.length} CUTS
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 mt-8 pt-4 border-t border-[#D8D5CE]">
            <button
              onClick={handleDownload}
              className="w-full py-3 bg-[#181818] hover:bg-[#383838] text-[#F7F6F2] font-semibold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer rounded-md"
            >
              <Download className="w-4 h-4" />
              <span>Download Master Copy (PNG)</span>
            </button>

            <button
              onClick={handleDelete}
              className="w-full py-2.5 bg-[#FAF9F6] hover:bg-red-50 text-red-700 hover:text-red-800 border border-[#D8D5CE] hover:border-red-300 font-semibold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer rounded-md"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete from Vault</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
