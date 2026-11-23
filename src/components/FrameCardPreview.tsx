import React, { useEffect, useState } from 'react'
import type { FrameTemplate } from '../types'
import { renderCompositeCanvas } from '../utils/canvasRenderer'

const previewCache = new Map<string, string>()

interface FrameCardPreviewProps {
  frame: FrameTemplate
  className?: string
}

export const FrameCardPreview: React.FC<FrameCardPreviewProps> = ({ frame, className = '' }) => {
  const cacheKey = `${frame.id}_${frame.bgColor}_${frame.defaultVenue}`
  const [previewUrl, setPreviewUrl] = useState<string>(
    frame.imageTemplateUrl || previewCache.get(cacheKey) || ''
  )

  useEffect(() => {
    if (frame.imageTemplateUrl) {
      setPreviewUrl(frame.imageTemplateUrl)
      return
    }
    let mounted = true
    if (previewCache.has(cacheKey)) {
      setPreviewUrl(previewCache.get(cacheKey)!)
      return
    }

    renderCompositeCanvas({
      frame,
      filterId: 'natural',
      shots: [], // Empty shots renders big bold 1, 2, 3, 4 numbered slots!
      scale: 1,
    })
      .then((url) => {
        previewCache.set(cacheKey, url)
        if (mounted) setPreviewUrl(url)
      })
      .catch((err) => console.error('Preview render failed:', err))

    return () => {
      mounted = false
    }
  }, [frame, cacheKey])

  if (!previewUrl) {
    return (
      <div
        className={`flex items-center justify-center animate-pulse rounded-lg ${className}`}
        style={{ backgroundColor: frame.bgColor }}
      >
        <span className="text-xs font-mono opacity-60" style={{ color: frame.textColor }}>
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
