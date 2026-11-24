import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Download,
  RotateCcw,
  Sparkles,
  Archive,
  Check,
  Video,
  Play,
  Pause,
  X,
  RotateCw,
  Maximize2,
  SlidersHorizontal,
  Plus,
  Trash2,
  Search,
  Copy,
  Eraser,
} from 'lucide-react'
import { ResultActions } from './ResultActions'
import { QrDownloadModal } from './QrDownloadModal'
import { buildResultFilename, dataUrlToBlob, downloadBlob } from '../utils/download'
import type {
  FilterCategory,
  FilterId,
  FrameTemplate,
  MemeStickerCategory,
  PlacedSticker,
  User,
  VideoFilterId,
} from '../types'
import { PHOTO_FILTERS } from '../constants/filters'
import { STICKER_OPTIONS } from '../constants/frames'
import {
  drawCompositeOnCanvas,
  drawFramelessTimelapseOnCanvas,
  loadImage,
  renderCompositeCanvas,
} from '../utils/canvasRenderer'
import { removeBackgroundFromDataUrl } from '../utils/bgRemover'
import { sound } from '../utils/sound'
import confetti from 'canvas-confetti'

type EditorStepId = 'frame' | 'layout' | 'filter' | 'sticker' | 'video_frame' | 'timelapse'

const EDITOR_STEPS: { id: EditorStepId; number: number; label: string }[] = [
  { id: 'frame', number: 1, label: 'FRAME' },
  { id: 'layout', number: 2, label: 'LAYOUT' },
  { id: 'filter', number: 3, label: 'FILTER' },
  { id: 'sticker', number: 4, label: 'STICKER' },
  { id: 'video_frame', number: 5, label: 'VIDEO FRAME' },
  { id: 'timelapse', number: 6, label: 'TIMELAPSE' },
]

const VIDEO_FILTER_LIST: { id: VideoFilterId; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'bw', label: 'B&W' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'negative', label: 'Negative' },
  { id: 'blur', label: 'Blur' },
  { id: 'warm', label: 'Warm Film' },
  { id: 'cyber', label: 'Cyber 800T' },
  { id: 'vintage', label: 'Vintage 90s' },
]

const FILTER_CATEGORIES: ('Semua' | FilterCategory)[] = [
  'Semua',
  'Studio & Beauty',
  'Analog & Kodak',
  'Fuji & Japan',
  'Monochrome B&W',
  'Y2K & Cyber',
  'Cinematic Mood',
  'Retro & Lomo',
  'Experimental FX',
]

interface PhotoReviewProps {
  shots: string[]
  videoClips?: string[][]
  videoUrls?: string[]
  isMirrored?: boolean
  frame: FrameTemplate
  allFrames: FrameTemplate[]
  onSelectFrame: (f: FrameTemplate) => void
  initialFilter?: FilterId
  user: User
  isDark: boolean
  onRetakeAll: () => void
  onRetakeSlot: (slotIndex: number) => void
  onSaveToArchive: (
    compositeDataUrl: string,
    caption: string,
    venue: string,
    filterId: FilterId
  ) => void
}

export const PhotoReview: React.FC<PhotoReviewProps> = ({
  shots,
  videoClips = [],
  videoUrls = [],
  isMirrored = true,
  frame,
  allFrames,
  onSelectFrame,
  initialFilter = 'natural',
  user,
  isDark,
  onRetakeAll,
  onRetakeSlot,
  onSaveToArchive,
}) => {
  // Start strictly at Step 1 ('frame'). Forward navigation only via NEXT button; backward via BACK or clicking previous completed steps!
  const [activeStep, setActiveStep] = useState<EditorStepId>('frame')
  const [selectedFilter, setSelectedFilter] = useState<FilterId>(initialFilter)
  const [filterCat, setFilterCat] = useState<'Semua' | FilterCategory>('Semua')
  const [filterSearch, setFilterSearch] = useState('')
  const [frameSearch, setFrameSearch] = useState('')

  const [videoFilter, setVideoFilter] = useState<VideoFilterId>('normal')
  const [showStickers, setShowStickers] = useState(true)
  const [autoRemoveStickerBg, setAutoRemoveStickerBg] = useState(true)
  const [isRemovingBg, setIsRemovingBg] = useState(false)

  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([])
  const [activeStickerInstanceId, setActiveStickerInstanceId] = useState<string | null>(null)
  const [stickerTab, setStickerTab] = useState<'All' | MemeStickerCategory>('All')
  const [stickerGroup, setStickerGroup] = useState<
    'all' | 'monkey' | 'cat' | 'hamster' | 'hero' | 'meme'
  >('all')

  const customStickerInputRef = useRef<HTMLInputElement>(null)
  const stageWrapperRef = useRef<HTMLDivElement>(null)
  const draggingStickerRef = useRef<{
    instanceId: string
    mode: 'move' | 'resize' | 'rotate'
    startX: number
    startY: number
    initXRatio: number
    initYRatio: number
    initScale: number
    initRotation: number
  } | null>(null)

  const [venue, setVenue] = useState(frame.defaultVenue)
  const [caption, setCaption] = useState(
    frame.defaultArtist || 'John Mayer — The Search for Everything'
  )
  const [showDate, setShowDate] = useState(true)

  const [compositeUrl, setCompositeUrl] = useState<string>('')
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrPhotoBlob, setQrPhotoBlob] = useState<Blob | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isPlayingVideo, setIsPlayingVideo] = useState(true)
  const [isExportingVideo, setIsExportingVideo] = useState(false)

  const liveCanvasRef = useRef<HTMLCanvasElement>(null)
  const loadedShotsRef = useRef<(HTMLImageElement | null)[]>([])
  const loadedClipsRef = useRef<HTMLImageElement[][]>([])
  const loadedVideosRef = useRef<(HTMLVideoElement | null)[]>([])
  const loadedStickersMapRef = useRef<Map<string, HTMLImageElement>>(new Map())

  useEffect(() => {
    setVenue(frame.defaultVenue)
    if (frame.defaultArtist) {
      setCaption(frame.defaultArtist)
    }
    if (frame.imageTemplateUrl && !loadedStickersMapRef.current.has(frame.imageTemplateUrl)) {
      loadImage(frame.imageTemplateUrl)
        .then((img) => {
          loadedStickersMapRef.current.set(frame.imageTemplateUrl!, img)
          updateStaticComposite()
        })
        .catch(() => {})
    }
    if (frame.customOverlayUrl && !loadedStickersMapRef.current.has(frame.customOverlayUrl)) {
      loadImage(frame.customOverlayUrl)
        .then((img) => loadedStickersMapRef.current.set(frame.customOverlayUrl!, img))
        .catch(() => {})
    }
  }, [frame])

  useEffect(() => {
    placedStickers.forEach((st) => {
      if (!loadedStickersMapRef.current.has(st.imageUrl)) {
        loadImage(st.imageUrl)
          .then((img) => {
            loadedStickersMapRef.current.set(st.imageUrl, img)
          })
          .catch(() => {})
      }
    })
  }, [placedStickers])

  useEffect(() => {
    let active = true
    Promise.all(
      Array.from({ length: frame.slots }).map(async (_, idx) => {
        const s = shots[idx]
        if (!s) return null
        try {
          return await loadImage(s)
        } catch {
          return null
        }
      })
    ).then((imgs) => {
      if (active) loadedShotsRef.current = imgs
    })

    Promise.all(
      Array.from({ length: frame.slots }).map(async (_, idx) => {
        const clipUrls =
          videoClips[idx] && videoClips[idx].length > 0
            ? videoClips[idx]
            : shots[idx]
            ? [shots[idx]]
            : []
        const loaded = await Promise.all(
          clipUrls.map(async (u) => {
            try {
              return await loadImage(u)
            } catch {
              return null
            }
          })
        )
        return loaded.filter((x): x is HTMLImageElement => x !== null)
      })
    ).then((clips) => {
      if (active) loadedClipsRef.current = clips
    })

    return () => {
      active = false
    }
  }, [shots, videoClips, frame.slots])

  const updateStaticComposite = useCallback(async () => {
    try {
      const url = await renderCompositeCanvas({
        frame,
        filterId: selectedFilter,
        shots,
        caption,
        venue,
        showDate,
        scale: 2,
        showStickers,
        placedStickers,
        videoFilter: activeStep === 'video_frame' ? videoFilter : 'normal',
      })
      setCompositeUrl(url)
    } catch (e) {
      console.error('Failed to render composite:', e)
    }
  }, [
    frame,
    selectedFilter,
    shots,
    caption,
    venue,
    showDate,
    showStickers,
    placedStickers,
    videoFilter,
    activeStep,
  ])

  useEffect(() => {
    if (!draggingStickerRef.current) {
      updateStaticComposite()
    }
  }, [updateStaticComposite])

  // Control real DOM-mounted <video> playback cleanly (only play on video_frame / timelapse!)
  useEffect(() => {
    const videos = loadedVideosRef.current
    if (activeStep === 'video_frame' && isPlayingVideo) {
      videos.forEach((v) => {
        if (v) {
          v.muted = true
          v.playbackRate = 1.0
          if (v.ended) v.currentTime = 0
          v.play().catch(() => {})
        }
      })
    } else if (activeStep === 'timelapse' && isPlayingVideo) {
      videos.forEach((v) => {
        if (v) {
          v.muted = true
          v.playbackRate = 2.0
          if (v.ended) v.currentTime = 0
          v.play().catch(() => {})
        }
      })
    } else {
      videos.forEach((v) => v?.pause())
    }
  }, [activeStep, isPlayingVideo, videoUrls, frame.slots])

  // Canvas Rendering Engine (Smooth 30fps real video playback like real Photobooth!):
  // - Steps 1..4 (frame, layout, filter, sticker): STATIC PHOTO ONLY (no video motion!)
  // - Step 5 (video_frame): SMOOTH 30FPS REAL VIDEO PLAYBACK INSIDE FRAME!
  // - Step 6 (timelapse): FRAMELESS PURE VIDEO/PHOTO TIMELAPSE (no frame border!)
  useEffect(() => {
    let animId: number
    let tick = 0
    let lastDrawTime = 0

    const renderFrame = (now: number) => {
      const isAnimatedStep = activeStep === 'video_frame' || activeStep === 'timelapse'
      if (isAnimatedStep && now - lastDrawTime < 30) {
        animId = requestAnimationFrame(renderFrame)
        return
      }
      lastDrawTime = now

      const canvas = liveCanvasRef.current
      if (canvas) {
        if (activeStep === 'timelapse') {
          tick += isPlayingVideo ? 1 : 0
          const validVideos = loadedVideosRef.current.filter(
            (v): v is HTMLVideoElement => Boolean(v && v.readyState >= 2)
          )

          if (validVideos.length > 0) {
            const vIdx = Math.floor(tick / 45) % validVideos.length
            const activeVid = validVideos[vIdx]
            if (isPlayingVideo && activeVid.paused) {
              activeVid.play().catch(() => {})
            }
            drawFramelessTimelapseOnCanvas(
              canvas,
              activeVid,
              selectedFilter,
              videoFilter,
              1,
              true,
              isMirrored
            )
          } else {
            const allTimelapseFrames: HTMLImageElement[] = []
            loadedClipsRef.current.forEach((clip) => {
              clip.forEach((img) => allTimelapseFrames.push(img))
            })
            if (allTimelapseFrames.length === 0) {
              loadedShotsRef.current.forEach((img) => {
                if (img) allTimelapseFrames.push(img)
              })
            }

            const frameIdx =
              allTimelapseFrames.length > 0
                ? Math.floor(tick * 0.2) % allTimelapseFrames.length
                : 0
            const currentImg = allTimelapseFrames[frameIdx] || null
            drawFramelessTimelapseOnCanvas(
              canvas,
              currentImg,
              selectedFilter,
              videoFilter,
              1,
              true,
              false
            )
          }
        } else if (activeStep === 'video_frame') {
          tick += isPlayingVideo ? 1 : 0

          const currentSources: (HTMLImageElement | HTMLVideoElement | null)[] = Array.from({
            length: frame.slots,
          }).map((_, slotIdx) => {
            const vid = loadedVideosRef.current[slotIdx]
            if (vid && vid.readyState >= 2) {
              if (isPlayingVideo && vid.paused) {
                vid.play().catch(() => {})
              }
              return vid
            }
            const slotClip = loadedClipsRef.current[slotIdx]
            if (slotClip && slotClip.length > 0) {
              return slotClip[Math.floor(tick * 0.12) % slotClip.length]
            }
            return loadedShotsRef.current[slotIdx] || null
          })

          const scrubberProgress = 0.65 + ((tick % 120) / 120) * 0.32

          drawCompositeOnCanvas(canvas, currentSources, {
            frame,
            filterId: selectedFilter,
            shots,
            caption,
            venue,
            showDate,
            scale: 1.35,
            showStickers,
            placedStickers,
            videoFilter,
            animProgress: scrubberProgress,
            loadedStickerMap: loadedStickersMapRef.current,
            fastPreview: true,
            mirrorVideo: isMirrored,
          })
        } else {
          // STEPS 1, 2, 3, 4: STATIC PHOTO ONLY (Tampilan fotonya saja, belum play video!)
          drawCompositeOnCanvas(canvas, loadedShotsRef.current, {
            frame,
            filterId: selectedFilter,
            shots,
            caption,
            venue,
            showDate,
            scale: 1.5,
            showStickers,
            placedStickers,
            videoFilter: 'normal',
            animProgress: 0.85,
            loadedStickerMap: loadedStickersMapRef.current,
            fastPreview: Boolean(draggingStickerRef.current),
          })
        }
      }

      if (isAnimatedStep) {
        animId = requestAnimationFrame(renderFrame)
      }
    }

    animId = requestAnimationFrame(renderFrame)
    return () => cancelAnimationFrame(animId)
  }, [
    activeStep,
    isPlayingVideo,
    frame,
    selectedFilter,
    shots,
    videoUrls,
    isMirrored,
    caption,
    venue,
    showDate,
    showStickers,
    placedStickers,
    videoFilter,
  ])

  const handleAddSticker = (stickerId: string, label: string, imageUrl: string) => {
    sound.playClick()
    setShowStickers(true)
    const offset = (placedStickers.length % 5) * 0.06
    const newInst: PlacedSticker = {
      instanceId: `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      stickerId,
      label,
      imageUrl,
      xRatio: Math.min(0.82, Math.max(0.18, 0.48 + offset)),
      yRatio: Math.min(0.82, Math.max(0.18, 0.36 + offset)),
      scale: 1,
      rotation: 0,
    }
    loadImage(imageUrl)
      .then((img) => {
        loadedStickersMapRef.current.set(imageUrl, img)
        setPlacedStickers((prev) => [...prev, newInst])
        setActiveStickerInstanceId(newInst.instanceId)
      })
      .catch(() => {})
  }

  // Upload custom sticker + Optional Automatic Background Remover!
  const handleUploadCustomSticker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        let finalUrl = reader.result
        if (autoRemoveStickerBg) {
          setIsRemovingBg(true)
          try {
            finalUrl = await removeBackgroundFromDataUrl(reader.result, 52)
          } catch {
            // fallback to original
          } finally {
            setIsRemovingBg(false)
          }
        }
        handleAddSticker(`custom_${Date.now()}`, file.name, finalUrl)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const startStickerPointerAction = (
    e: React.PointerEvent,
    st: PlacedSticker,
    mode: 'move' | 'resize' | 'rotate'
  ) => {
    e.stopPropagation()
    setActiveStickerInstanceId(st.instanceId)
    draggingStickerRef.current = {
      instanceId: st.instanceId,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      initXRatio: st.xRatio,
      initYRatio: st.yRatio,
      initScale: st.scale,
      initRotation: st.rotation,
    }
  }

  const handleStagePointerMove = (e: React.PointerEvent) => {
    const drag = draggingStickerRef.current
    if (!drag || !stageWrapperRef.current) return

    const rect = stageWrapperRef.current.getBoundingClientRect()
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY

    setPlacedStickers((prev) =>
      prev.map((item) => {
        if (item.instanceId !== drag.instanceId) return item
        if (drag.mode === 'move') {
          const nextX = Math.min(0.95, Math.max(0.05, drag.initXRatio + dx / rect.width))
          const nextY = Math.min(0.95, Math.max(0.05, drag.initYRatio + dy / rect.height))
          return { ...item, xRatio: nextX, yRatio: nextY }
        } else if (drag.mode === 'resize') {
          const deltaScale = (dx + dy) / 140
          const nextScale = Math.min(2.6, Math.max(0.4, drag.initScale + deltaScale))
          return { ...item, scale: nextScale }
        } else {
          const nextRot = drag.initRotation + dx * 0.9
          return { ...item, rotation: nextRot }
        }
      })
    )
  }

  const handleStagePointerUp = () => {
    if (draggingStickerRef.current) {
      draggingStickerRef.current = null
      updateStaticComposite()
    }
  }

  const handleDeleteSticker = (instanceId: string) => {
    sound.playClick()
    setPlacedStickers((prev) => prev.filter((s) => s.instanceId !== instanceId))
    if (activeStickerInstanceId === instanceId) {
      setActiveStickerInstanceId(null)
    }
  }

  const handleDuplicateSticker = (st: PlacedSticker) => {
    sound.playClick()
    const copy: PlacedSticker = {
      ...st,
      instanceId: `st_${Date.now()}`,
      xRatio: Math.min(0.9, st.xRatio + 0.06),
      yRatio: Math.min(0.9, st.yRatio + 0.06),
    }
    setPlacedStickers((prev) => [...prev, copy])
    setActiveStickerInstanceId(copy.instanceId)
  }

  const handleDownloadPhoto = (format: 'png' | 'jpeg') => {
    if (!compositeUrl) return
    sound.playShutter()
    const blob = dataUrlToBlob(compositeUrl)
    const ext = format === 'jpeg' ? 'jpg' : 'png'
    downloadBlob(blob, buildResultFilename(ext))

    confetti({
      particleCount: 55,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#FFB020', '#38BDF8', '#FACC15', '#FFFFFF'],
    })
  }

  const handleOpenQrDownload = () => {
    if (!compositeUrl) return
    const blob = dataUrlToBlob(compositeUrl)
    setQrPhotoBlob(blob)
    setQrModalOpen(true)
  }

  const handleDownloadCanvasVideo = (label: string) => {
    const canvas = liveCanvasRef.current
    if (!canvas || isExportingVideo) return

    sound.playClick()
    setIsPlayingVideo(true)
    setIsExportingVideo(true)

    try {
      const stream = canvas.captureStream(30)
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        downloadBlob(blob, buildResultFilename('webm', `urbooth-${label.toLowerCase()}`))
        setIsExportingVideo(false)

        confetti({
          particleCount: 65,
          spread: 75,
          origin: { y: 0.8 },
        })
      }

      recorder.start()
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop()
        }
      }, 3200)
    } catch (err) {
      console.error('Video export error:', err)
      setIsExportingVideo(false)
      handleDownloadPhoto('png')
    }
  }

  const handleSaveArchiveClick = () => {
    sound.playClick()
    onSaveToArchive(compositeUrl, caption, venue, selectedFilter)
    setIsSaved(true)
  }

  const currentStepIndex = EDITOR_STEPS.findIndex((s) => s.id === activeStep)

  const goPrevStep = () => {
    sound.playClick()
    if (currentStepIndex > 0) {
      setActiveStep(EDITOR_STEPS[currentStepIndex - 1].id)
    } else {
      onRetakeAll()
    }
  }

  const goNextStep = () => {
    sound.playClick()
    if (currentStepIndex < EDITOR_STEPS.length - 1) {
      setActiveStep(EDITOR_STEPS[currentStepIndex + 1].id)
    } else {
      handleDownloadPhoto('png')
    }
  }

  const compatibleFrames = allFrames.filter(
    (f) =>
      f.slots <= shots.length &&
      (!frameSearch.trim() ||
        f.name.toLowerCase().includes(frameSearch.toLowerCase()) ||
        f.tag.toLowerCase().includes(frameSearch.toLowerCase()))
  )

  const filteredPhotoFilters = PHOTO_FILTERS.filter((f) => {
    const matchesCat = filterCat === 'Semua' || f.category === filterCat
    const matchesSearch =
      !filterSearch.trim() ||
      f.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      f.description.toLowerCase().includes(filterSearch.toLowerCase())
    return matchesCat && matchesSearch
  })

  const filteredStickers = STICKER_OPTIONS.filter((st) => {
    const matchesTab = stickerTab === 'All' || st.category === stickerTab
    const matchesGroup = stickerGroup === 'all' || st.group === stickerGroup
    return matchesTab && matchesGroup
  })

  return (
    <div
      onPointerMove={handleStagePointerMove}
      onPointerUp={handleStagePointerUp}
      className={`w-full rounded-3xl overflow-hidden flex flex-col ${
        isDark ? 'glass-panel-dark' : 'glass-panel-light'
      }`}
    >
      {/* ==================== TOP 6-STEP PROGRESS HEADER (STRICT BACK-ONLY CLICK, FORWARD ONLY VIA NEXT) ==================== */}
      <div
        className={`w-full py-3.5 px-4 border-b flex items-center justify-center overflow-x-auto ${
          isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white/60 border-slate-200/80'
        }`}
      >
        <div className="flex items-center space-x-2 sm:space-x-4">
          {EDITOR_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex
            const isActive = step.id === activeStep
            const isFutureLocked = idx > currentStepIndex

            return (
              <React.Fragment key={step.id}>
                <button
                  disabled={isFutureLocked}
                  onClick={() => {
                    if (idx < currentStepIndex) {
                      sound.playClick()
                      setActiveStep(step.id)
                    }
                  }}
                  title={
                    isFutureLocked
                      ? 'Tekan tombol NEXT untuk melanjutkan ke tahap ini'
                      : isCompleted
                      ? `Kembali ke tahap ${step.label}`
                      : step.label
                  }
                  className={`flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase transition-all shrink-0 ${
                    isActive
                      ? isDark
                        ? 'bg-white text-slate-900 shadow-lg cursor-default'
                        : 'bg-slate-900 text-white shadow-lg cursor-default'
                      : isCompleted
                      ? isDark
                        ? 'text-slate-200 hover:bg-white/10 cursor-pointer'
                        : 'text-slate-800 hover:bg-slate-900/5 cursor-pointer'
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        isActive
                          ? isDark
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-slate-900'
                          : isDark
                          ? 'bg-white/10 text-slate-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {step.number}
                    </span>
                  )}
                  <span>{step.label}</span>
                </button>

                {idx < EDITOR_STEPS.length - 1 && (
                  <span className="text-xs opacity-30">›</span>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* ==================== MAIN SPLIT WORKSPACE ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[700px]">
        {/* Left/Center 8 Cols: Clean Stage */}
        <div
          onClick={() => setActiveStickerInstanceId(null)}
          className={`lg:col-span-8 p-6 sm:p-10 flex flex-col items-center justify-center relative select-none ${
            isDark ? 'bg-slate-950/40' : 'bg-[#D6D8DF]/75'
          }`}
        >
          {/* Top-Left Stage Status Badge & Quick Retake All Button */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 border border-white/15">
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeStep === 'video_frame' || activeStep === 'timelapse'
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-sky-400'
                  }`}
                />
                {activeStep === 'timelapse'
                  ? 'TIMELAPSE MURNI (TANPA FRAME)'
                  : activeStep === 'video_frame'
                  ? 'LIVE VIDEO FRAME PLAYING'
                  : 'PHOTO PREVIEW'}
              </span>

              {(activeStep === 'video_frame' || activeStep === 'timelapse') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    sound.playClick()
                    setIsPlayingVideo(!isPlayingVideo)
                  }}
                  className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                >
                  {isPlayingVideo ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>

            {/* Always-accessible Retake Foto Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                sound.playClick()
                onRetakeAll()
              }}
              className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-[#FFB020] backdrop-blur-md text-white text-[11px] font-bold flex items-center space-x-1.5 border border-white/15 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retake Foto</span>
            </button>
          </div>

          {/* Canvas + Interactive Sticker Gizmos */}
          <div
            ref={stageWrapperRef}
            className="relative inline-flex items-center justify-center shadow-2xl rounded-xl overflow-visible"
          >
            <canvas
              ref={liveCanvasRef}
              className={`object-contain block pointer-events-none ${
                activeStep === 'timelapse'
                  ? 'max-w-full max-h-[500px] rounded-2xl'
                  : 'max-h-[620px] w-auto'
              }`}
            />

            {/* Interactive Sticker Transform Handles (only when NOT on frameless timelapse) */}
            {showStickers &&
              activeStep !== 'timelapse' &&
              placedStickers.map((st) => {
                const isSelected = activeStickerInstanceId === st.instanceId
                const boxSize = Math.round(78 * st.scale)

                return (
                  <div
                    key={st.instanceId}
                    onPointerDown={(e) => startStickerPointerAction(e, st, 'move')}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveStickerInstanceId(st.instanceId)
                    }}
                    style={{
                      left: `${st.xRatio * 100}%`,
                      top: `${st.yRatio * 100}%`,
                      width: `${boxSize}px`,
                      height: `${boxSize}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute cursor-move flex items-center justify-center transition-shadow ${
                      isSelected
                        ? 'rounded-full border-2 border-dashed border-white shadow-[0_0_0_2px_rgba(0,0,0,0.35)] z-30'
                        : 'hover:border hover:border-white/50 rounded-full z-20'
                    }`}
                  >
                    {isSelected && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicateSticker(st)
                          }}
                          title="Duplikat Stiker"
                          className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-white text-slate-900 border border-slate-300 shadow-md flex items-center justify-center hover:scale-110 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSticker(st.instanceId)
                          }}
                          title="Hapus Stiker"
                          className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-red-500 text-white border-2 border-white shadow-md flex items-center justify-center hover:scale-110 cursor-pointer"
                        >
                          <X className="w-3 h-3 stroke-[3]" />
                        </button>

                        <button
                          type="button"
                          onPointerDown={(e) => startStickerPointerAction(e, st, 'rotate')}
                          onClick={(e) => {
                            e.stopPropagation()
                            setPlacedStickers((prev) =>
                              prev.map((item) =>
                                item.instanceId === st.instanceId
                                  ? { ...item, rotation: (item.rotation + 25) % 360 }
                                  : item
                              )
                            )
                          }}
                          title="Putar Stiker"
                          className="absolute -bottom-2.5 -left-2.5 w-6 h-6 rounded-full bg-teal-500 text-white border-2 border-white shadow-md flex items-center justify-center hover:scale-110 cursor-ew-resize"
                        >
                          <RotateCw className="w-3 h-3 stroke-[2.5]" />
                        </button>

                        <button
                          type="button"
                          onPointerDown={(e) => startStickerPointerAction(e, st, 'resize')}
                          onClick={(e) => {
                            e.stopPropagation()
                            setPlacedStickers((prev) =>
                              prev.map((item) =>
                                item.instanceId === st.instanceId
                                  ? {
                                      ...item,
                                      scale: item.scale > 1.6 ? 0.75 : item.scale + 0.2,
                                    }
                                  : item
                              )
                            )
                          }}
                          title="Ubah Ukuran"
                          className="absolute -bottom-2.5 -right-2.5 w-6 h-6 rounded-full bg-blue-500 text-white border-2 border-white shadow-md flex items-center justify-center hover:scale-110 cursor-nwse-resize"
                        >
                          <Maximize2 className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </>
                    )}
                  </div>
                )
              })}
          </div>
        </div>

        {/* Right 4 Cols: Step Control Sidebar */}
        <div
          className={`lg:col-span-4 p-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l ${
            isDark
              ? 'bg-slate-900/55 border-white/10 text-white'
              : 'bg-white/85 border-slate-200 text-slate-900'
          }`}
        >
          <div className="space-y-5 overflow-y-auto max-h-[550px] pr-1">
            {/* ---------------- STEP 1: FRAME ---------------- */}
            {activeStep === 'frame' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold tracking-wider uppercase">
                    1. PILIH DESAIN FRAME
                  </h3>
                  <span className="text-[10px] font-semibold opacity-60">
                    {compatibleFrames.length} Frame
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    type="text"
                    value={frameSearch}
                    onChange={(e) => setFrameSearch(e.target.value)}
                    placeholder="Cari frame (Jeans, Koran, Music, Meme...)"
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#FFB020] ${
                      isDark
                        ? 'bg-white/5 border-white/15 text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[370px] overflow-y-auto pr-1">
                  {compatibleFrames.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        sound.playClick()
                        onSelectFrame(f)
                      }}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        f.id === frame.id
                          ? 'bg-[#FFB020] text-[#0F0F14] border-[#FFB020] shadow-md'
                          : isDark
                          ? 'glass-card-dark text-slate-300 hover:text-white'
                          : 'glass-card-light text-slate-700 hover:text-black'
                      }`}
                    >
                      <div className="truncate">{f.name}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{f.tag}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ---------------- STEP 2: LAYOUT & RETAKE SLOT ---------------- */}
            {activeStep === 'layout' && (
              <div className="space-y-5">
                <h3 className="text-sm font-extrabold tracking-wider uppercase">
                  2. LAYOUT & RETAKE FOTO
                </h3>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold opacity-75">Tampilkan Tanggal</span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick()
                      setShowDate(!showDate)
                    }}
                    className={`px-3 py-1 rounded-lg border text-xs font-bold cursor-pointer ${
                      showDate
                        ? 'bg-[#FFB020] text-[#0F0F14] border-[#FFB020]'
                        : 'border-slate-500 text-slate-400'
                    }`}
                  >
                    {showDate ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <label className="block text-xs font-bold mb-2 opacity-75">
                    Klik Foto untuk Retake Per Slot:
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {shots.map((shot, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          sound.playClick()
                          onRetakeSlot(idx)
                        }}
                        className="group relative aspect-4/3 rounded-xl overflow-hidden border border-white/20 cursor-pointer"
                      >
                        <img
                          src={shot}
                          alt={`Slot ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity">
                          <RotateCcw className="w-3.5 h-3.5 mb-1 text-[#FFB020]" />
                          <span>Retake #{idx + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- STEP 3: 108+ PHOTO FILTERS ---------------- */}
            {activeStep === 'filter' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold tracking-wider uppercase">
                    3. PRO FILTERS ({PHOTO_FILTERS.length})
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFB020]/15 text-[#FFB020] text-[10px] font-bold">
                    {filteredPhotoFilters.length} Hasil
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    type="text"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="Cari dari 108+ filter..."
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#FFB020] ${
                      isDark
                        ? 'bg-white/5 border-white/15 text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5">
                  {FILTER_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        sound.playClick()
                        setFilterCat(cat)
                      }}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                        filterCat === cat
                          ? 'bg-[#FFB020] text-[#0F0F14] shadow'
                          : isDark
                          ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[370px] overflow-y-auto pr-1">
                  {filteredPhotoFilters.map((f) => {
                    const active = selectedFilter === f.id
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          sound.playClick()
                          setSelectedFilter(f.id)
                          setVideoFilter('normal')
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          active
                            ? 'bg-[#FFB020] text-[#0F0F14] border-[#FFB020] shadow-md'
                            : isDark
                            ? 'glass-card-dark text-slate-200 hover:border-white/30'
                            : 'glass-card-light text-slate-800 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/40"
                            style={{ backgroundColor: f.previewColor }}
                          />
                          <span className="font-bold text-[11px] truncate">{f.name}</span>
                        </div>
                        <span className="text-[9px] opacity-75 line-clamp-1 mt-1">
                          {f.description}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ---------------- STEP 4: MEME STICKER + AUTO REMOVE BG ---------------- */}
            {activeStep === 'sticker' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-white/10">
                  <button
                    onClick={() => {
                      sound.playClick()
                      setStickerTab('All')
                      setStickerGroup('all')
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      stickerTab === 'All'
                        ? 'bg-[#FFB020] text-[#0F0F14] border-[#FFB020]'
                        : isDark
                        ? 'border-white/15 text-slate-300'
                        : 'border-slate-300 text-slate-700'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Filters</span>
                  </button>

                  {(['New', 'Trending', 'Top Used'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        sound.playClick()
                        setStickerTab(t)
                      }}
                      className={`text-xs font-extrabold cursor-pointer transition-colors ${
                        stickerTab === t
                          ? isDark
                            ? 'text-white underline underline-offset-4'
                            : 'text-slate-900 underline underline-offset-4'
                          : 'opacity-50 hover:opacity-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {(
                    [
                      { id: 'all', label: 'All Memes' },
                      { id: 'monkey', label: 'Monkeys' },
                      { id: 'cat', label: 'Meme Cats' },
                      { id: 'hamster', label: 'Hamster' },
                      { id: 'hero', label: 'Superhero' },
                      { id: 'meme', label: 'Denim & News' },
                    ] as const
                  ).map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        sound.playClick()
                        setStickerGroup(g.id)
                      }}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer ${
                        stickerGroup === g.id
                          ? 'bg-[#FFB020] text-[#0F0F14]'
                          : isDark
                          ? 'bg-white/5 text-slate-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 max-h-[290px] overflow-y-auto pr-1 py-1">
                  {filteredStickers.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleAddSticker(st.id, st.label, st.svgDataUrl)}
                      title={`Tambah ${st.label}`}
                      className={`group p-2.5 rounded-2xl border flex flex-col items-center justify-center transition-all hover:scale-105 cursor-pointer ${
                        isDark
                          ? 'glass-card-dark hover:border-[#FFB020]'
                          : 'glass-card-light hover:border-[#FFB020]'
                      }`}
                    >
                      <img
                        src={st.svgDataUrl}
                        alt={st.label}
                        className="w-14 h-14 object-contain drop-shadow-md"
                      />
                      <span className="text-[9px] font-bold opacity-70 truncate w-full text-center mt-1">
                        {st.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* AUTO REMOVE BACKGROUND TOGGLE FOR UPLOADED STICKERS */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Eraser className="w-4 h-4 text-[#FFB020]" />
                    <div>
                      <p className="text-[11px] font-bold leading-tight">
                        Hapus Background Otomatis
                      </p>
                      <p className="text-[9px] opacity-60">
                        Potong background saat upload stiker
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick()
                      setAutoRemoveStickerBg(!autoRemoveStickerBg)
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer ${
                      autoRemoveStickerBg
                        ? 'bg-[#FFB020] text-[#0F0F14]'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {autoRemoveStickerBg ? 'ON' : 'OFF'}
                  </button>
                </div>

                <input
                  ref={customStickerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadCustomSticker}
                  className="hidden"
                />
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick()
                      setPlacedStickers([])
                      setActiveStickerInstanceId(null)
                    }}
                    className="py-2.5 rounded-full border border-red-400/60 text-red-500 hover:bg-red-500/10 text-[11px] font-extrabold tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>REMOVE ALL</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRemovingBg}
                    onClick={() => customStickerInputRef.current?.click()}
                    className={`py-2.5 rounded-full border text-[11px] font-extrabold tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      isDark
                        ? 'border-white/20 text-white hover:bg-white/10'
                        : 'border-slate-300 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isRemovingBg ? 'MENGHAPUS BG...' : 'ADD STICKER'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- STEP 5: VIDEO FRAME (Video plays here!) ---------------- */}
            {activeStep === 'video_frame' && (
              <div className="space-y-6">
                <h3 className="text-sm font-extrabold tracking-wider uppercase">
                  VIDEO FILTERS
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {VIDEO_FILTER_LIST.map((vf) => {
                    const isSelected = videoFilter === vf.id
                    return (
                      <button
                        key={vf.id}
                        onClick={() => {
                          sound.playClick()
                          setVideoFilter(vf.id)
                        }}
                        className={`py-4 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FFB020] text-[#0F0F14] border-[#FFB020] shadow-md'
                            : isDark
                            ? 'glass-card-dark text-slate-200 hover:bg-white/10'
                            : 'glass-card-light text-slate-800 hover:bg-white'
                        }`}
                      >
                        {vf.label}
                      </button>
                    )
                  })}
                </div>

                <div
                  className={`pt-5 border-t flex items-center justify-between ${
                    isDark ? 'border-white/10' : 'border-slate-200'
                  }`}
                >
                  <span className="text-xs font-semibold">Show Stickers</span>
                  <button
                    onClick={() => {
                      sound.playClick()
                      setShowStickers(!showStickers)
                    }}
                    className={`px-3 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${
                      showStickers
                        ? 'bg-[#FFB020] border-[#FFB020] text-white'
                        : 'border-slate-400 text-slate-400'
                    }`}
                  >
                    {showStickers ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleDownloadCanvasVideo('VIDEO_FRAME')}
                    disabled={isExportingVideo}
                    className={`w-full py-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                      isDark
                        ? 'glass-card-dark hover:bg-white/10 text-white'
                        : 'glass-card-light hover:bg-slate-100 text-slate-900'
                    }`}
                  >
                    <Video className="w-4 h-4 text-[#FFB020]" />
                    <span>
                      {isExportingVideo
                        ? 'Merekam Video Frame (3 detik)...'
                        : 'Download Video Frame (.WEBM)'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- STEP 6: FRAMELESS TIMELAPSE & EXPORT ---------------- */}
            {activeStep === 'timelapse' && (
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold tracking-wider uppercase">
                  6. TIMELAPSE & UNDUH HASIL
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Pilih <strong>Unduh Foto</strong> langsung ke perangkat ini atau{' '}
                  <strong>Unduh via QR</strong> untuk scan dan simpan langsung dari HP kamu.
                </p>

                <div className="space-y-3 pt-1">
                  <ResultActions
                    onDownloadPhoto={() => handleDownloadPhoto('png')}
                    onDownloadVideo={() => handleDownloadCanvasVideo('TIMELAPSE')}
                    onOpenQrDownload={handleOpenQrDownload}
                    hasVideo={true}
                    isExportingVideo={isExportingVideo}
                    disabled={!compositeUrl}
                    isDark={isDark}
                  />

                  <button
                    type="button"
                    onClick={() => handleDownloadPhoto('jpeg')}
                    className={`w-full py-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      isDark
                        ? 'glass-card-dark text-slate-200 hover:bg-white/10'
                        : 'glass-card-light text-slate-800 hover:bg-white'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Format JPG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveArchiveClick}
                    disabled={isSaved}
                    className={`w-full py-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      isSaved
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-[#FFB020]/15 border-[#FFB020]/40 text-[#FFB020]'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Tersimpan di Galeri!</span>
                      </>
                    ) : user.role !== 'guest' ? (
                      <>
                        <Archive className="w-4 h-4" />
                        <span>Simpan ke Galeri Lokal</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Simpan ke Galeri</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Pinned BACK & NEXT Pill Buttons */}
          <div className="pt-5 mt-5 border-t border-white/10 grid grid-cols-2 gap-3">
            <button
              onClick={goPrevStep}
              className={`py-3 rounded-full border text-xs font-extrabold tracking-wider uppercase cursor-pointer transition-all ${
                isDark
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : 'border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
            >
              KEMBALI
            </button>

            <button
              onClick={goNextStep}
              className={`py-3 rounded-full text-xs font-extrabold tracking-wider uppercase cursor-pointer transition-all shadow-lg ${
                isDark
                  ? 'bg-white text-slate-900 hover:bg-slate-200'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {activeStep === 'timelapse' ? 'UNDUH FOTO' : 'LANJUT'}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden DOM-mounted <video> elements so Chrome decodes every frame smoothly at 30fps */}
      <div
        aria-hidden="true"
        className="fixed -left-[9999px] top-0 w-2 h-2 overflow-hidden opacity-0 pointer-events-none"
      >
        {videoUrls.map((url, idx) =>
          url ? (
            <video
              key={`${idx}_${url}`}
              ref={(el) => {
                loadedVideosRef.current[idx] = el
              }}
              src={url}
              muted
              loop
              playsInline
              preload="auto"
              onCanPlay={(e) => {
                if (
                  (activeStep === 'video_frame' || activeStep === 'timelapse') &&
                  isPlayingVideo
                ) {
                  e.currentTarget.playbackRate = activeStep === 'timelapse' ? 2.0 : 1.0
                  e.currentTarget.play().catch(() => {})
                }
              }}
              onEnded={(e) => {
                if (
                  (activeStep === 'video_frame' || activeStep === 'timelapse') &&
                  isPlayingVideo
                ) {
                  e.currentTarget.currentTime = 0
                  e.currentTarget.play().catch(() => {})
                }
              }}
            />
          ) : null
        )}
      </div>

      {/* Modal Opsi B: Unduh via QR */}
      <QrDownloadModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        photoBlob={qrPhotoBlob}
        frameName={frame.name}
        onDirectDownloadFallback={() => handleDownloadPhoto('png')}
        isDark={isDark}
      />
    </div>
  )
}
