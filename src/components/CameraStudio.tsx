import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Volume2,
  VolumeX,
  FlipHorizontal,
  AlertCircle,
  Eye,
  Camera,
  Upload,
  Sparkles,
  ArrowLeft,
  Check,
  Video,
} from 'lucide-react'
import type { CameraDevice, FilterId, FrameTemplate, StudioSettings } from '../types'
import { PHOTO_FILTERS } from '../constants/filters'
import { sound } from '../utils/sound'

interface CameraStudioProps {
  selectedFrame: FrameTemplate
  onCompleteCapture: (
    shots: string[],
    activeFilter?: FilterId,
    recordedVideoClips?: string[][],
    recordedVideoUrls?: string[]
  ) => void
  settings: StudioSettings
  onUpdateSettings: (settings: Partial<StudioSettings>) => void
  retakeSlotIndex?: number | null
  initialMode?: 'camera' | 'upload'
  isDark: boolean
  onBackToBrowse: () => void
}

export const CameraStudio: React.FC<CameraStudioProps> = ({
  selectedFrame,
  onCompleteCapture,
  settings,
  onUpdateSettings,
  retakeSlotIndex,
  initialMode = 'camera',
  isDark,
  onBackToBrowse,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<'camera' | 'upload'>(initialMode)
  const [liveFilter, setLiveFilter] = useState<FilterId>('natural')

  const [devices, setDevices] = useState<CameraDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const [isCapturing, setIsCapturing] = useState(false)
  const [currentSlot, setCurrentSlot] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [flashActive, setFlashActive] = useState(false)
  const [capturedShots, setCapturedShots] = useState<string[]>([])
  const [uploadingSlot, setUploadingSlot] = useState<number>(0)

  const activeFilterObj = PHOTO_FILTERS.find((f) => f.id === liveFilter) || PHOTO_FILTERS[0]

  const startCamera = useCallback(
    async (deviceId?: string) => {
      if (mode !== 'camera') return
      try {
        setCameraError(null)
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
        }

        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 960, min: 480 },
            facingMode: deviceId ? undefined : 'user',
          },
          audio: false,
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            setCameraReady(true)
          }
        }

        const allDevices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = allDevices
          .filter((d) => d.kind === 'videoinput')
          .map((d, index) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${index + 1}`,
          }))

        setDevices(videoDevices)
        if (!selectedDeviceId && videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId)
        }
      } catch (err: unknown) {
        console.error('Camera access error:', err)
        const errorMsg =
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Izin kamera ditolak. Silakan izinkan akses kamera di browser atau gunakan fitur Upload Foto / Sample Reel.'
            : 'Kamera tidak terdeteksi. Gunakan fitur Upload dari Galeri atau Sample Studio Reel di bawah.'
        setCameraError(errorMsg)
        setCameraReady(false)
      }
    },
    [selectedDeviceId, mode]
  )

  useEffect(() => {
    if (mode === 'camera') {
      startCamera(selectedDeviceId)
    } else if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [startCamera, selectedDeviceId, mode])

  const captureCurrentFrame = (targetWidth = 960): string | null => {
    if (!videoRef.current) return null
    const video = videoRef.current
    const canvas = document.createElement('canvas')

    const vw = video.videoWidth || 1280
    const vh = video.videoHeight || 960
    const ratio = vh / vw

    canvas.width = targetWidth
    canvas.height = Math.round(targetWidth * ratio)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    if (settings.isMirrored) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.88)
  }

  const startBurstSequence = () => {
    if (!cameraReady || isCapturing) return
    setIsCapturing(true)
    setCapturedShots([])
    setCurrentSlot(0)
    runSlotCapture(0, [], [], [])
  }

  const runSlotCapture = (
    slotIndex: number,
    accumulatedShots: string[],
    accumulatedClips: string[][],
    accumulatedVideoUrls: string[]
  ) => {
    setCurrentSlot(slotIndex)
    let count = settings.timerDuration
    setCountdown(count)

    if (settings.soundEnabled) sound.playBeep(false)

    // Record REAL smooth 30fps live video clip using MediaRecorder during countdown!
    let slotRecorder: MediaRecorder | null = null
    const recordedChunks: BlobPart[] = []
    let recorderStoppedPromise: Promise<string> = Promise.resolve('')

    if (streamRef.current && typeof MediaRecorder !== 'undefined') {
      try {
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : ''
        slotRecorder = mimeType
          ? new MediaRecorder(streamRef.current, { mimeType, videoBitsPerSecond: 2_500_000 })
          : new MediaRecorder(streamRef.current)

        slotRecorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) recordedChunks.push(ev.data)
        }
        recorderStoppedPromise = new Promise<string>((resolve) => {
          if (!slotRecorder) return resolve('')
          slotRecorder.onstop = () => {
            if (recordedChunks.length > 0) {
              const blob = new Blob(recordedChunks, { type: mimeType || 'video/webm' })
              resolve(URL.createObjectURL(blob))
            } else {
              resolve('')
            }
          }
        })
        // Tanpa timeslice agar menghasilkan 1 kontainer WebM utuh 30fps yang mulus tanpa patah
        slotRecorder.start()
      } catch {
        slotRecorder = null
      }
    }

    const timerInterval = setInterval(() => {
      count -= 1
      if (count > 0) {
        setCountdown(count)
        if (settings.soundEnabled) sound.playBeep(false)
      } else {
        clearInterval(timerInterval)
        setCountdown(null)

        if (settings.soundEnabled) {
          sound.playBeep(true)
          sound.playShutter()
        }

        if (settings.flashEnabled) {
          setFlashActive(true)
          setTimeout(() => setFlashActive(false), 280)
        }

        const shot = captureCurrentFrame(1080) || ''
        if (slotRecorder && slotRecorder.state === 'recording') {
          slotRecorder.stop()
        }

        recorderStoppedPromise.then((slotVideoUrl) => {
          const nextShots = [...accumulatedShots, shot]
          const nextClips = [...accumulatedClips, shot ? [shot] : []]
          const nextVideoUrls = [...accumulatedVideoUrls, slotVideoUrl]
          setCapturedShots(nextShots)

          if (retakeSlotIndex !== undefined && retakeSlotIndex !== null) {
            setTimeout(() => {
              setIsCapturing(false)
              onCompleteCapture(nextShots, liveFilter, nextClips, nextVideoUrls)
            }, 450)
            return
          }

          if (slotIndex + 1 < selectedFrame.slots) {
            setTimeout(() => {
              runSlotCapture(slotIndex + 1, nextShots, nextClips, nextVideoUrls)
            }, 850)
          } else {
            setTimeout(() => {
              setIsCapturing(false)
              onCompleteCapture(nextShots, liveFilter, nextClips, nextVideoUrls)
            }, 450)
          }
        })
      }
    }, 1000)
  }

  const handleSimulateCapture = () => {
    sound.playClick()
    setIsCapturing(true)
    const simulatedImages = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=900&auto=format&fit=crop&q=80',
    ]

    const cuts = simulatedImages.slice(0, selectedFrame.slots)
    // Build multi-frame clips for smooth Video Frame playback
    const clips = cuts.map((c, i) => [
      c,
      simulatedImages[(i + 1) % simulatedImages.length],
      c,
    ])
    setTimeout(() => {
      setIsCapturing(false)
      onCompleteCapture(cuts, liveFilter, clips)
    }, 650)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const updated = [...capturedShots]

    let processed = 0
    fileArray.forEach((file, idx) => {
      const targetSlot = uploadingSlot + idx
      if (targetSlot >= selectedFrame.slots) return
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          updated[targetSlot] = reader.result
        }
        processed++
        if (processed === Math.min(fileArray.length, selectedFrame.slots - uploadingSlot)) {
          setCapturedShots([...updated])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const allSlotsFilled =
    capturedShots.filter(Boolean).length >=
    (retakeSlotIndex !== null && retakeSlotIndex !== undefined ? 1 : selectedFrame.slots)

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center pb-12">
      {/* Studio Top Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-800/40">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              sound.playClick()
              onBackToBrowse()
            }}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#17171D] border-zinc-800 text-zinc-300 hover:text-white'
                : 'bg-white border-zinc-200 text-zinc-700 hover:text-black'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#FFB020] animate-ping" />
              <h2 className={`font-extrabold text-base ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {selectedFrame.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#FFB020]/15 text-[#FFB020] text-[10px] font-bold flex items-center gap-1">
                <Video className="w-3 h-3" />
                LIVE VIDEO FRAME READY
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {selectedFrame.layoutLabel} • Otomatis merekam Foto + Video Frame & Timelapse
            </p>
          </div>
        </div>

        {/* Mode Switcher (Camera vs Upload) + Camera Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <div
            className={`flex p-1 rounded-xl border ${
              isDark ? 'bg-[#17171D] border-zinc-800' : 'bg-zinc-100 border-zinc-300'
            }`}
          >
            <button
              onClick={() => {
                sound.playClick()
                setMode('camera')
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                mode === 'camera'
                  ? 'bg-[#FFB020] text-[#0F0F14]'
                  : isDark
                  ? 'text-zinc-400 hover:text-white'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Kamera</span>
            </button>
            <button
              onClick={() => {
                sound.playClick()
                setMode('upload')
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                mode === 'upload'
                  ? 'bg-[#FFB020] text-[#0F0F14]'
                  : isDark
                  ? 'text-zinc-400 hover:text-white'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Foto</span>
            </button>
          </div>

          {mode === 'camera' && (
            <>
              <button
                onClick={() => {
                  sound.playClick()
                  onUpdateSettings({ isMirrored: !settings.isMirrored })
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                  settings.isMirrored
                    ? 'bg-[#FFB020] text-[#0F0F14] border-[#FFB020]'
                    : isDark
                    ? 'bg-[#17171D] text-zinc-400 border-zinc-800'
                    : 'bg-white text-zinc-700 border-zinc-300'
                }`}
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mirror</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick()
                  onUpdateSettings({ soundEnabled: !settings.soundEnabled })
                }}
                className={`p-2 rounded-xl border cursor-pointer transition-all ${
                  settings.soundEnabled
                    ? 'bg-[#FFB020] text-[#0F0F14] border-[#FFB020]'
                    : isDark
                    ? 'bg-[#17171D] text-zinc-400 border-zinc-800'
                    : 'bg-white text-zinc-700 border-zinc-300'
                }`}
              >
                {settings.soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
              </button>

              <div
                className={`flex items-center p-1 rounded-xl border ${
                  isDark ? 'bg-[#17171D] border-zinc-800' : 'bg-white border-zinc-300'
                }`}
              >
                {([3, 5, 10] as const).map((sec) => (
                  <button
                    key={sec}
                    onClick={() => {
                      sound.playClick()
                      onUpdateSettings({ timerDuration: sec })
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      settings.timerDuration === sec
                        ? 'bg-[#FFB020] text-[#0F0F14]'
                        : isDark
                        ? 'text-zinc-400 hover:text-white'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content: Camera Viewfinder OR Upload Dropzone */}
      {mode === 'camera' ? (
        <>
          <div className="relative w-full bg-[#09090C] border border-zinc-800 shadow-2xl overflow-hidden aspect-4/3 sm:aspect-16/9 flex items-center justify-center rounded-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ filter: activeFilterObj.cssFilter }}
              className={`w-full h-full object-cover transition-transform ${
                settings.isMirrored ? 'scale-x-[-1]' : ''
              }`}
            />

            {/* Viewfinder HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-semibold text-white/90 bg-black/45 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="font-bold">REC • PHOTO + VIDEO FRAME</span>
                </div>
                <div className="hidden sm:block">FILTER: {activeFilterObj.name.toUpperCase()}</div>
                <div className="font-bold text-[#FFB020]">
                  {isCapturing
                    ? `SHOT ${currentSlot + 1} / ${selectedFrame.slots}`
                    : `${selectedFrame.slots} CUTS READY`}
                </div>
              </div>

              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-9xl sm:text-[150px] font-extrabold font-black text-white drop-shadow-[0_6px_28px_rgba(0,0,0,0.75)] select-none">
                    {countdown}
                  </span>
                </div>
              )}

              {flashActive && (
                <div className="absolute inset-0 bg-white animate-flash pointer-events-none" />
              )}

              <div className="flex items-center justify-between text-[11px] font-semibold text-white/80 bg-black/45 backdrop-blur-xs px-3.5 py-1 rounded-full border border-white/10">
                <span>FRAME: {selectedFrame.name}</span>
                <span>RATIO: {selectedFrame.aspectRatioLabel}</span>
              </div>
            </div>

            {cameraError && (
              <div className="absolute inset-0 bg-[#14141A] p-6 flex flex-col items-center justify-center text-center z-20">
                <AlertCircle className="w-11 h-11 text-[#FFB020] mb-3" />
                <h3 className="font-extrabold text-lg text-white mb-1">
                  Kamera Tidak Tersedia
                </h3>
                <p className="text-xs text-zinc-400 max-w-md mb-5">{cameraError}</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => startCamera(selectedDeviceId)}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Ulang Kamera</span>
                  </button>
                  <button
                    onClick={() => setMode('upload')}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload dari Perangkat</span>
                  </button>
                  <button
                    onClick={handleSimulateCapture}
                    className="px-5 py-2.5 bg-[#FFB020] hover:bg-[#F28C1B] text-[#0F0F14] text-xs font-bold rounded-xl flex items-center space-x-2 cursor-pointer shadow-lg"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Gunakan Foto & Video Sample</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live Camera Filter Strip (16 Filters!) */}
          <div className="w-full mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Pilih Filter Kamera Live ({PHOTO_FILTERS.length} Filter):
              </span>
              {devices.length > 1 && (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value)
                    startCamera(e.target.value)
                  }}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                    isDark
                      ? 'bg-[#17171D] border-zinc-800 text-white'
                      : 'bg-white border-zinc-300 text-zinc-900'
                  }`}
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {PHOTO_FILTERS.map((f) => {
                const active = liveFilter === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      sound.playClick()
                      setLiveFilter(f.id)
                    }}
                    className={`shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center space-x-2 cursor-pointer transition-all ${
                      active
                        ? 'bg-[#FFB020] text-[#0F0F14] border-[#FFB020] shadow-md'
                        : isDark
                        ? 'bg-[#17171D] border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: f.previewColor }}
                    />
                    <span>{f.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Captured Slots Buffer & Big Pink Shutter Button */}
          <div
            className={`w-full mt-4 p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDark ? 'bg-[#17171D] border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                SLOT FOTO:
              </span>
              <div className="flex items-center space-x-2">
                {Array.from({ length: selectedFrame.slots }).map((_, idx) => {
                  const shot = capturedShots[idx]
                  return (
                    <div
                      key={idx}
                      className={`w-12 h-10 rounded-lg border overflow-hidden flex items-center justify-center ${
                        isCapturing && currentSlot === idx
                          ? 'ring-2 ring-[#FFB020] border-[#FFB020]'
                          : isDark
                          ? 'bg-[#111115] border-zinc-700'
                          : 'bg-zinc-100 border-zinc-300'
                      }`}
                    >
                      {shot ? (
                        <img
                          src={shot}
                          alt={`Slot ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-zinc-500">{idx + 1}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleSimulateCapture}
                disabled={isCapturing}
                className={`px-4 py-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white'
                    : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-black'
                }`}
              >
                Sample Reel
              </button>

              <button
                onClick={startBurstSequence}
                disabled={!cameraReady || isCapturing}
                className={`px-8 py-3.5 rounded-xl bg-[#FFB020] hover:bg-[#F28C1B] text-[#0F0F14] font-bold text-xs uppercase tracking-wider flex items-center space-x-2.5 shadow-lg  cursor-pointer transition-all ${
                  isCapturing ? 'opacity-80 cursor-wait' : ''
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isCapturing
                    ? `MEMOTRET FOTO ${currentSlot + 1}...`
                    : `MULAI FOTO (${selectedFrame.slots} CUTS)`}
                </span>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Upload Gallery Mode ("Start from Upload") */
        <div
          className={`w-full rounded-2xl border p-6 sm:p-8 ${
            isDark ? 'bg-[#17171D] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <div className="text-center max-w-lg mx-auto mb-6">
            <h3 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Upload Foto dari Galeri Perangkat
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Pilih {selectedFrame.slots} foto dari perangkatmu untuk dimasukkan ke dalam frame{' '}
              <strong>{selectedFrame.name}</strong>.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {Array.from({ length: selectedFrame.slots }).map((_, idx) => {
              const shot = capturedShots[idx]
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setUploadingSlot(idx)
                    fileInputRef.current?.click()
                  }}
                  className={`group relative aspect-4/3 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all ${
                    shot
                      ? 'border-[#FFB020]'
                      : isDark
                      ? 'bg-[#111115] border-zinc-700 hover:border-[#FFB020]'
                      : 'bg-zinc-50 border-zinc-300 hover:border-[#FFB020]'
                  }`}
                >
                  {shot ? (
                    <>
                      <img
                        src={shot}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                        Ganti Foto #{idx + 1}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-extrabold font-black text-[#FFB020] mb-1">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400">
                        + Pilih Foto
                      </span>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={handleSimulateCapture}
              className={`px-5 py-3 rounded-xl border text-xs font-bold cursor-pointer ${
                isDark
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-300'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-700'
              }`}
            >
              Isi Otomatis dengan Foto Sample
            </button>

            <button
              disabled={!allSlotsFilled}
              onClick={() => {
                sound.playShutter()
                const clips = capturedShots.map((s) => [s])
                onCompleteCapture(capturedShots, liveFilter, clips)
              }}
              className={`px-7 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                allSlotsFilled
                  ? 'bg-[#FFB020] hover:bg-[#F28C1B] text-[#0F0F14] cursor-pointer shadow-lg'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                Lanjut ke Editor & Video Frame ({capturedShots.filter(Boolean).length}/
                {selectedFrame.slots})
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
