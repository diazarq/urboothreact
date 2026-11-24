import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Download,
  Film,
  Clock,
  AlertCircle,
  Loader2,
  Camera,
  Check,
  Sparkles,
} from 'lucide-react'
import { fetchSharedResult, type SharedResultManifest } from '../services/resultShare'
import { buildResultFilename, dataUrlToBlob, downloadBlob } from '../utils/download'

type PageState =
  | { status: 'loading' }
  | { status: 'ok'; data: SharedResultManifest }
  | { status: 'expired' }
  | { status: 'not_found' }
  | { status: 'error'; message: string }

export const DownloadPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>()
  const [state, setState] = useState<PageState>({ status: 'loading' })
  const [isDownloadingPhoto, setIsDownloadingPhoto] = useState(false)
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false)
  const [downloadedPhoto, setDownloadedPhoto] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })

    fetchSharedResult(id, controller.signal).then((res) => {
      if (controller.signal.aborted) return
      if (res.status === 'ok') {
        setState({ status: 'ok', data: res.data })
      } else if (res.status === 'expired') {
        setState({ status: 'expired' })
      } else if (res.status === 'not_found') {
        setState({ status: 'not_found' })
      } else {
        setState({ status: 'error', message: res.message })
      }
    })

    return () => controller.abort()
  }, [id])

  const handleDownloadPhoto = async () => {
    if (state.status !== 'ok') return
    setIsDownloadingPhoto(true)
    try {
      const { photoUrl } = state.data
      let blob: Blob
      if (photoUrl.startsWith('data:')) {
        blob = dataUrlToBlob(photoUrl)
      } else {
        const res = await fetch(photoUrl)
        if (!res.ok) throw new Error('Gagal mengunduh gambar')
        blob = await res.blob()
      }
      const ext = blob.type.includes('png') ? 'png' : 'jpg'
      downloadBlob(blob, buildResultFilename(ext))
      setDownloadedPhoto(true)
      window.setTimeout(() => setDownloadedPhoto(false), 2500)
    } catch {
      // Fallback jika CORS menghalangi fetch blob
      window.open(state.data.photoUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setIsDownloadingPhoto(false)
    }
  }

  const handleDownloadVideo = async () => {
    if (state.status !== 'ok' || !state.data.videoUrl) return
    setIsDownloadingVideo(true)
    try {
      const res = await fetch(state.data.videoUrl)
      if (!res.ok) throw new Error('Gagal mengunduh video')
      const blob = await res.blob()
      downloadBlob(blob, buildResultFilename('webm', 'urbooth-video'))
    } catch {
      window.open(state.data.videoUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setIsDownloadingVideo(false)
    }
  }

  const formatExpiry = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return '24 jam'
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0F0F14] text-white flex flex-col relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="ambient-orb-accent -top-24 -left-24 w-[320px] h-[320px]" />
        <div className="ambient-orb-hover -bottom-24 -right-24 w-[340px] h-[340px]" />
      </div>

      {/* Header Ringkas Mobile-First */}
      <header className="relative z-10 w-full max-w-lg mx-auto px-4 pt-5 pb-3 flex items-center justify-between">
        <Link to="/" className="logo-box">
          <img src="/urbooth-logo.jpg" alt="Urbooth" className="h-8 w-auto rounded-md" />
        </Link>
        <span className="badge-outline inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>HASIL FOTO</span>
        </span>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-lg mx-auto px-4 py-4 pb-12 flex flex-col justify-center">
        {/* LOADING */}
        {state.status === 'loading' && (
          <div className="glass-panel-dark p-10 flex flex-col items-center text-center space-y-4">
            <Loader2 className="w-10 h-10 text-[#FFB020] animate-spin" />
            <p className="text-[16px] font-semibold">Memuat hasil foto Urbooth...</p>
          </div>
        )}

        {/* EXPIRED (> 24 JAM) */}
        {state.status === 'expired' && (
          <div className="glass-panel-dark p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FFB020]/15 border border-[#FFB020]/40 flex items-center justify-center">
              <Clock className="w-7 h-7 text-[#FFB020]" />
            </div>
            <h1 className="text-heading">Link sudah kedaluwarsa</h1>
            <p className="text-[14px] text-[#B8B8C4] leading-[1.6]">
              Demi menjaga privasi, link dan file hasil foto Urbooth hanya berlaku selama{' '}
              <strong>24 jam</strong> dan sudah otomatis dihapus.
            </p>
            <Link
              to="/"
              className="btn-primary w-full min-h-[52px] mt-2 py-3.5 px-6 text-[16px] flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>Foto lagi di Urbooth</span>
            </Link>
          </div>
        )}

        {/* NOT FOUND / ERROR */}
        {(state.status === 'not_found' || state.status === 'error') && (
          <div className="glass-panel-dark p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/35 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h1 className="text-heading">
              {state.status === 'not_found' ? 'Foto tidak ditemukan' : 'Gagal memuat foto'}
            </h1>
            <p className="text-[14px] text-[#B8B8C4] leading-[1.6]">
              {state.status === 'error'
                ? state.message
                : 'Link yang kamu buka tidak valid atau masa berlaku 24 jam sudah habis.'}
            </p>
            <Link
              to="/"
              className="btn-primary w-full min-h-[52px] mt-2 py-3.5 px-6 text-[16px] flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>Buka Urbooth Photobooth</span>
            </Link>
          </div>
        )}

        {/* SUCCESS: MOBILE-FIRST PREVIEW + BIG DOWNLOAD BUTTONS */}
        {state.status === 'ok' && (
          <div className="glass-panel-dark p-5 sm:p-6 space-y-5">
            <div className="text-center space-y-1.5">
              <h1 className="text-heading">
                {state.data.frameName || 'Hasil foto Urbooth'}
              </h1>
              <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#FFB020]">
                <Clock className="w-3.5 h-3.5" />
                <span>Berlaku hingga {formatExpiry(state.data.expiresAt)}</span>
              </div>
            </div>

            {/* Pratinjau Foto */}
            <div className="w-full rounded-[16px] bg-[#0F0F14]/80 border border-white/12 p-3 flex items-center justify-center">
              <img
                src={state.data.photoUrl}
                alt="Hasil foto photobooth Urbooth"
                className="max-h-[62vh] w-auto object-contain rounded-xl"
              />
            </div>

            {/* Pratinjau Video / Timelapse jika ada */}
            {state.data.videoUrl && (
              <div className="space-y-2">
                <p className="text-[12px] font-semibold text-[#B8B8C4]">
                  Pratinjau video / timelapse
                </p>
                <video
                  src={state.data.videoUrl}
                  controls
                  playsInline
                  loop
                  className="w-full rounded-[16px] bg-black border border-white/12 max-h-[45vh]"
                />
              </div>
            )}

            {/* Tombol Unduh Besar & Mudah Ditekan di HP */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                disabled={isDownloadingPhoto}
                onClick={handleDownloadPhoto}
                className="btn-primary w-full min-h-[56px] py-4 px-6 text-[16px] flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {isDownloadingPhoto ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : downloadedPhoto ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                <span>
                  {isDownloadingPhoto
                    ? 'Mengunduh foto...'
                    : downloadedPhoto
                    ? 'Foto berhasil diunduh!'
                    : 'Unduh foto'}
                </span>
              </button>

              {state.data.videoUrl && (
                <button
                  type="button"
                  disabled={isDownloadingVideo}
                  onClick={handleDownloadVideo}
                  className="btn-secondary w-full min-h-[54px] py-4 px-6 text-[16px] flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {isDownloadingVideo ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Film className="w-5 h-5 text-[#FFB020]" />
                  )}
                  <span>{isDownloadingVideo ? 'Mengunduh video...' : 'Unduh video / GIF'}</span>
                </button>
              )}
            </div>

            <p className="text-center text-[12px] text-[#B8B8C4]">
              Tips HP iOS/Android: Jika foto terbuka di tab baru, tekan tahan gambar lalu pilih{' '}
              <strong>Simpan ke Foto</strong>.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
