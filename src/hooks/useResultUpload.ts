import { useState, useRef, useCallback, useEffect } from 'react'
import { uploadSharedResult } from '../services/resultShare'

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UseResultUploadOptions {
  videoBlob?: Blob | null
  frameName?: string
}

export function useResultUpload(blob: Blob | null, options?: UseResultUploadOptions) {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState<number>(0)
  const [resultId, setResultId] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLocalFallback, setIsLocalFallback] = useState<boolean>(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const videoBlob = options?.videoBlob ?? null
  const frameName = options?.frameName

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    cancel()
    setStatus('idle')
    setProgress(0)
    setResultId(null)
    setShareUrl(null)
    setExpiresAt(null)
    setErrorMessage(null)
    setIsLocalFallback(false)
  }, [cancel])

  const startUpload = useCallback(async () => {
    if (!blob) {
      setStatus('error')
      setErrorMessage('Hasil foto belum siap diunggah. Coba lagi sebentar.')
      return
    }

    cancel()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setStatus('uploading')
    setProgress(5)
    setErrorMessage(null)

    try {
      const uploaded = await uploadSharedResult({
        photoBlob: blob,
        videoBlob,
        frameName,
        signal: controller.signal,
        onProgress: (pct) => {
          if (!controller.signal.aborted) {
            setProgress(pct)
          }
        },
      })

      if (controller.signal.aborted) return

      setResultId(uploaded.id)
      setShareUrl(uploaded.shareUrl)
      setExpiresAt(uploaded.expiresAt)
      setIsLocalFallback(uploaded.isLocalFallback)
      setProgress(100)
      setStatus('success')
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal mengunggah hasil foto. Periksa koneksi internetmu.'
      setErrorMessage(msg)
      setStatus('error')
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
    }
  }, [blob, videoBlob, frameName, cancel])

  const retry = useCallback(() => {
    void startUpload()
  }, [startUpload])

  // Otomatis batalkan upload yang masih berjalan jika komponen unmount
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [cancel])

  return {
    status,
    progress,
    resultId,
    shareUrl,
    expiresAt,
    errorMessage,
    isLocalFallback,
    startUpload,
    retry,
    cancel,
    reset,
  }
}
