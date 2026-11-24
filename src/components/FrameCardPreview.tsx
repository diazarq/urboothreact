import React, { useEffect, useState } from 'react'
import type { FrameTemplate } from '../types'
import { renderCompositeCanvas } from '../utils/canvasRenderer'

const previewCache = new Map<string, string>()

// Foto contoh nyata agar kartu pratinjau frame selalu menampilkan hasil nyata, bukan slot kosong
const SAMPLE_PREVIEW_SHOTS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=480&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=480&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=480&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=480&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=480&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=480&auto=format&fit=crop&q=75',
]

interface FrameCardPreviewProps {
  frame: FrameTemplate
  className?: string
}

export const FrameCardPreview: React.FC<FrameCardPreviewProps> = ({ frame, className = '' }) => {
  const cacheKey = `sample_v3_cutout_${frame.id}_${frame.bgColor}_${frame.defaultVenue}`
  const [previewUrl, setPreviewUrl] = useState<string>(
    previewCache.get(cacheKey) || frame.imageTemplateUrl || ''
  )

  useEffect(() => {
    let mounted = true
    if (previewCache.has(cacheKey)) {
      setPreviewUrl(previewCache.get(cacheKey)!)
      return
    }

    const sampleShots = Array.from({ length: frame.slots }).map(
      (_, i) => SAMPLE_PREVIEW_SHOTS[i % SAMPLE_PREVIEW_SHOTS.length]
    )

    renderCompositeCanvas({
      frame,
      filterId: 'natural',
      shots: sampleShots,
      scale: 0.65,
      fastPreview: true,
    })
      .then((url) => {
        previewCache.set(cacheKey, url)
        if (mounted) setPreviewUrl(url)
      })
      .catch(() => {
        if (mounted && frame.imageTemplateUrl) {
          setPreviewUrl(frame.imageTemplateUrl)
        }
      })

    return () => {
      mounted = false
    }
  }, [frame, cacheKey])

  if (!previewUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl ${className}`}
        style={{ backgroundColor: frame.bgColor }}
      >
        <span className="text-[12px] font-semibold" style={{ color: frame.textColor }}>
          {frame.code}
        </span>
      </div>
    )
  }

  return (
    <img
      src={previewUrl}
      alt={frame.name}
      loading="lazy"
      decoding="async"
      className={`object-contain select-none ${className}`}
      draggable={false}
    />
  )
}
