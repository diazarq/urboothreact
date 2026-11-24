import type { FilterId, FrameTemplate, PlacedSticker, VideoFilterId } from '../types'
import { PHOTO_FILTERS } from '../constants/filters'

export type MediaSource = HTMLImageElement | HTMLVideoElement

function getMediaDimensions(media: MediaSource): { w: number; h: number } {
  if (media instanceof HTMLVideoElement) {
    return { w: media.videoWidth || 640, h: media.videoHeight || 480 }
  }
  return { w: media.naturalWidth || media.width || 640, h: media.naturalHeight || media.height || 480 }
}

export interface RenderOptions {
  frame: FrameTemplate
  filterId: FilterId
  shots: string[]
  caption?: string
  venue?: string
  showDate?: boolean
  customDate?: string
  scale?: number
  showStickers?: boolean
  placedStickers?: PlacedSticker[]
  videoFilter?: VideoFilterId
  fastPreview?: boolean
  mirrorVideo?: boolean
}

let sharedOffscreenCanvas: HTMLCanvasElement | null = null
function getSharedOffscreenCanvas(w: number, h: number): HTMLCanvasElement {
  if (!sharedOffscreenCanvas) {
    sharedOffscreenCanvas = document.createElement('canvas')
  }
  if (sharedOffscreenCanvas.width !== w || sharedOffscreenCanvas.height !== h) {
    sharedOffscreenCanvas.width = w
    sharedOffscreenCanvas.height = h
  }
  return sharedOffscreenCanvas
}

function drawHeartClipPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const cx = x + w / 2
  const topDip = y + h * 0.28
  ctx.beginPath()
  ctx.moveTo(cx, topDip)
  ctx.bezierCurveTo(cx - w * 0.08, y - h * 0.04, x - w * 0.08, y + h * 0.08, x, y + h * 0.36)
  ctx.bezierCurveTo(x + w * 0.02, y + h * 0.65, cx - w * 0.16, y + h * 0.85, cx, y + h)
  ctx.bezierCurveTo(cx + w * 0.16, y + h * 0.85, x + w * 0.98, y + h * 0.65, x + w, y + h * 0.36)
  ctx.bezierCurveTo(x + w * 1.08, y + h * 0.08, cx + w * 0.08, y - h * 0.04, cx, topDip)
  ctx.closePath()
}

const imageElementCache = new Map<string, HTMLImageElement>()
const cutoutTemplateCache = new Map<string, HTMLCanvasElement | null>()

/**
 * Automatically converts a raster frame template (JPG/PNG with numbered solid slots)
 * into a pixel-perfect transparent-cutout PNG overlay!
 *
 * Pass 1: Samples each slot's placeholder fill color & flood-fills connected placeholder pixels.
 * Pass 2: Detects any floating island completely enclosed inside the hole (the slot numbers 1, 2, 3...)
 *         and punches them out too, while keeping ALL overlapping artwork (stars, dragons, vines,
 *         cat ears, stamp borders, ribbons, text) 100% opaque ON TOP of the user's photo!
 */
function getCutoutTemplateCanvas(
  frameId: string,
  tplImg: HTMLImageElement,
  slots: { x: number; y: number; w: number; h: number; rotation?: number }[]
): HTMLCanvasElement | null {
  const cacheKey = `${frameId}_${tplImg.naturalWidth}x${tplImg.naturalHeight}`
  if (cutoutTemplateCache.has(cacheKey)) {
    return cutoutTemplateCache.get(cacheKey)!
  }

  const w = tplImg.naturalWidth || tplImg.width
  const h = tplImg.naturalHeight || tplImg.height
  if (!w || !h) return null

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  ctx.drawImage(tplImg, 0, 0, w, h)
  let imgData: ImageData
  try {
    imgData = ctx.getImageData(0, 0, w, h)
  } catch {
    cutoutTemplateCache.set(cacheKey, null)
    return null
  }

  const data = imgData.data
  const totalPixels = w * h
  // 0 = opaque artwork, 1 = transparent hole
  const holeMask = new Uint8Array(totalPixels)
  let totalCutoutSuccess = 0

  const sampleOffsets: [number, number][] = [
    [0.2, 0.2],
    [0.8, 0.2],
    [0.2, 0.8],
    [0.8, 0.8],
    [0.5, 0.16],
    [0.5, 0.84],
    [0.16, 0.5],
    [0.84, 0.5],
    [0.32, 0.32],
    [0.68, 0.68],
  ]

  for (const slot of slots) {
    const sx = Math.round(slot.x * w)
    const sy = Math.round(slot.y * h)
    const sw = Math.max(8, Math.round(slot.w * w))
    const sh = Math.max(8, Math.round(slot.h * h))

    // Generous padded region so irregular ears/hexagons/hearts around the slot are captured
    const padX = Math.round(sw * 0.16)
    const padY = Math.round(sh * 0.16)
    const minX = Math.max(0, sx - padX)
    const minY = Math.max(0, sy - padY)
    const maxX = Math.min(w - 1, sx + sw + padX)
    const maxY = Math.min(h - 1, sy + sh + padY)
    const boxW = maxX - minX + 1
    const boxH = maxY - minY + 1

    // Collect interior samples avoiding the centered number
    const samples: [number, number, number][] = []
    for (const [ox, oy] of sampleOffsets) {
      const px = Math.min(w - 1, Math.max(0, Math.round(sx + sw * ox)))
      const py = Math.min(h - 1, Math.max(0, Math.round(sy + sh * oy)))
      const idx = (py * w + px) * 4
      samples.push([data[idx], data[idx + 1], data[idx + 2]])
    }

    // Find the most representative (cluster-center) color among the samples
    let bestSample = samples[0]
    let bestScore = -1
    for (let i = 0; i < samples.length; i++) {
      let closeCount = 0
      for (let j = 0; j < samples.length; j++) {
        const dr = samples[i][0] - samples[j][0]
        const dg = samples[i][1] - samples[j][1]
        const db = samples[i][2] - samples[j][2]
        if (dr * dr + dg * dg + db * db < 32 * 32) closeCount++
      }
      if (closeCount > bestScore) {
        bestScore = closeCount
        bestSample = samples[i]
      }
    }

    // If fewer than 4 interior samples agree on a fill color (e.g. scenic landscape placeholder), skip cutout
    if (bestScore < 4) continue

    const [tr, tg, tb] = bestSample
    const tolSq = 44 * 44
    const localHole = new Uint8Array(boxW * boxH)
    const queue = new Int32Array(boxW * boxH)
    let qHead = 0
    let qTail = 0

    // Seed BFS from all matching interior sample points
    for (const [ox, oy] of sampleOffsets) {
      const px = Math.min(maxX, Math.max(minX, Math.round(sx + sw * ox)))
      const py = Math.min(maxY, Math.max(minY, Math.round(sy + sh * oy)))
      const idx = (py * w + px) * 4
      const dr = data[idx] - tr
      const dg = data[idx + 1] - tg
      const db = data[idx + 2] - tb
      if (dr * dr + dg * dg + db * db <= tolSq) {
        const lIdx = (py - minY) * boxW + (px - minX)
        if (!localHole[lIdx]) {
          localHole[lIdx] = 1
          queue[qTail++] = lIdx
        }
      }
    }

    // Pass 1: Flood-fill connected slot interior pixels
    while (qHead < qTail) {
      const curr = queue[qHead++]
      const lx = curr % boxW
      const ly = (curr - lx) / boxW

      const neighbors = [
        lx > 0 ? curr - 1 : -1,
        lx + 1 < boxW ? curr + 1 : -1,
        ly > 0 ? curr - boxW : -1,
        ly + 1 < boxH ? curr + boxW : -1,
      ]

      for (let n = 0; n < 4; n++) {
        const next = neighbors[n]
        if (next < 0 || localHole[next]) continue
        const nx = minX + (next % boxW)
        const ny = minY + Math.floor(next / boxW)
        const idx = (ny * w + nx) * 4
        const dr = data[idx] - tr
        const dg = data[idx + 1] - tg
        const db = data[idx + 2] - tb
        if (dr * dr + dg * dg + db * db <= tolSq) {
          localHole[next] = 1
          queue[qTail++] = next
        }
      }
    }

    // Sanity check: did we find a real slot hole (at least 30% of slot area)?
    if (qTail < sw * sh * 0.3) continue

    // Pass 2: Flood-fill from the OUTER perimeter of the padded box across non-hole pixels
    // Anything NOT reachable from outside is an enclosed island (i.e. the slot number 1, 2, 3...) -> punch it out!
    const outsideReachable = new Uint8Array(boxW * boxH)
    let oHead = 0
    let oTail = 0

    const pushOutside = (lx: number, ly: number) => {
      const lIdx = ly * boxW + lx
      if (!localHole[lIdx] && !outsideReachable[lIdx]) {
        outsideReachable[lIdx] = 1
        queue[oTail++] = lIdx
      }
    }

    for (let lx = 0; lx < boxW; lx++) {
      pushOutside(lx, 0)
      pushOutside(lx, boxH - 1)
    }
    for (let ly = 0; ly < boxH; ly++) {
      pushOutside(0, ly)
      pushOutside(boxW - 1, ly)
    }

    while (oHead < oTail) {
      const curr = queue[oHead++]
      const lx = curr % boxW
      const ly = (curr - lx) / boxW

      if (lx > 0 && !localHole[curr - 1] && !outsideReachable[curr - 1]) {
        outsideReachable[curr - 1] = 1
        queue[oTail++] = curr - 1
      }
      if (lx + 1 < boxW && !localHole[curr + 1] && !outsideReachable[curr + 1]) {
        outsideReachable[curr + 1] = 1
        queue[oTail++] = curr + 1
      }
      if (ly > 0 && !localHole[curr - boxW] && !outsideReachable[curr - boxW]) {
        outsideReachable[curr - boxW] = 1
        queue[oTail++] = curr - boxW
      }
      if (ly + 1 < boxH && !localHole[curr + boxW] && !outsideReachable[curr + boxW]) {
        outsideReachable[curr + boxW] = 1
        queue[oTail++] = curr + boxW
      }
    }

    // Write final slot hole (both placeholder fill AND enclosed number islands) into global holeMask
    for (let ly = 0; ly < boxH; ly++) {
      const rowOff = (minY + ly) * w + minX
      const lRowOff = ly * boxW
      for (let lx = 0; lx < boxW; lx++) {
        const lIdx = lRowOff + lx
        if (localHole[lIdx] || !outsideReachable[lIdx]) {
          holeMask[rowOff + lx] = 1
        }
      }
    }

    totalCutoutSuccess++
  }

  if (totalCutoutSuccess === 0) {
    cutoutTemplateCache.set(cacheKey, null)
    return null
  }

  // Apply alpha = 0 to holes + subtle 1px anti-alias softening on edge pixels
  for (let i = 0; i < totalPixels; i++) {
    if (holeMask[i]) {
      data[i * 4 + 3] = 0
    }
  }

  // Soften 1px fringe directly touching the hole for crisp anti-aliased edges
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      if (!holeMask[i]) {
        const holeNeighbors =
          holeMask[i - 1] + holeMask[i + 1] + holeMask[i - w] + holeMask[i + w]
        if (holeNeighbors >= 2) {
          data[i * 4 + 3] = holeNeighbors >= 3 ? 110 : 185
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0)
  cutoutTemplateCache.set(cacheKey, canvas)
  return canvas
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageElementCache.has(src)) {
    return Promise.resolve(imageElementCache.get(src)!)
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageElementCache.set(src, img)
      resolve(img)
    }
    img.onerror = (e) => reject(e)
    img.src = src
  })
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawSlotPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  shape: 'rect' | 'rounded' | 'oval' = 'rect'
) {
  if (shape === 'oval') {
    ctx.beginPath()
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
    ctx.closePath()
  } else if (shape === 'rounded') {
    drawRoundedRectPath(ctx, x, y, w, h, 14)
  } else {
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.closePath()
  }
}

function drawImageCoverInShape(
  ctx: CanvasRenderingContext2D,
  img: MediaSource,
  x: number,
  y: number,
  targetWidth: number,
  targetHeight: number,
  shape: 'rect' | 'rounded' | 'oval' = 'rect',
  zoomFactor = 1,
  mirror = false
) {
  const { w: srcW, h: srcH } = getMediaDimensions(img)
  const imgRatio = srcW / srcH
  const targetRatio = targetWidth / targetHeight

  let renderWidth = targetWidth
  let renderHeight = targetHeight

  if (imgRatio > targetRatio) {
    renderHeight = targetHeight
    renderWidth = targetHeight * imgRatio
  } else {
    renderWidth = targetWidth
    renderHeight = targetWidth / imgRatio
  }

  renderWidth *= zoomFactor
  renderHeight *= zoomFactor
  const offsetX = (targetWidth - renderWidth) / 2
  const offsetY = (targetHeight - renderHeight) / 2

  ctx.save()
  drawSlotPath(ctx, x, y, targetWidth, targetHeight, shape)
  ctx.clip()
  if (mirror) {
    ctx.translate(x + targetWidth, y)
    ctx.scale(-1, 1)
    ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight)
  } else {
    ctx.drawImage(img, x + offsetX, y + offsetY, renderWidth, renderHeight)
  }
  ctx.restore()
}

function drawVectorStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  color: string
) {
  let rot = (Math.PI / 2) * 3
  let x = cx
  let y = cy
  const step = Math.PI / spikes

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(cx, cy - outerRadius)
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius
    y = cy + Math.sin(rot) * outerRadius
    ctx.lineTo(x, y)
    rot += step
    x = cx + Math.cos(rot) * innerRadius
    y = cy + Math.sin(rot) * innerRadius
    ctx.lineTo(x, y)
    rot += step
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

function drawDaisyFlower(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.save()
  const petals = 10
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = '#18181B'
  ctx.lineWidth = 1.5
  for (let i = 0; i < petals; i++) {
    const angle = (i * Math.PI * 2) / petals
    const px = cx + Math.cos(angle) * (radius * 0.7)
    const py = cy + Math.sin(angle) * (radius * 0.7)
    ctx.beginPath()
    ctx.arc(px, py, radius * 0.36, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
  ctx.fillStyle = '#FACC15'
  ctx.beginPath()
  ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function drawVectorHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save()
  ctx.beginPath()
  const topCurveHeight = size * 0.3
  ctx.moveTo(x, y + topCurveHeight)
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight)
  ctx.bezierCurveTo(
    x - size / 2,
    y + (size + topCurveHeight) / 2,
    x,
    y + (size + topCurveHeight) / 1.4,
    x,
    y + size
  )
  ctx.bezierCurveTo(
    x,
    y + (size + topCurveHeight) / 1.4,
    x + size / 2,
    y + (size + topCurveHeight) / 2,
    x + size / 2,
    y + topCurveHeight
  )
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

function drawCopperRivet(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, 5.5, 0, Math.PI * 2)
  ctx.fillStyle = '#B45309'
  ctx.fill()
  ctx.lineWidth = 1
  ctx.strokeStyle = '#78350F'
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2)
  ctx.fillStyle = '#FCD34D'
  ctx.fill()
  ctx.restore()
}

/**
 * Background patterns & textures
 */
function drawFrameBackgroundDecor(
  ctx: CanvasRenderingContext2D,
  frame: FrameTemplate,
  width: number,
  height: number
) {
  ctx.save()

  if (frame.illustration === 'denim_jeans' || frame.illustration === 'denim_patchwork') {
    // 1. Indigo Denim Twill Weave Texture
    if (frame.illustration === 'denim_patchwork') {
      // 4 Patchwork denim quadrants
      const washes = ['#1E3A5F', '#3B6291', '#2B4C7E', '#162C49']
      ctx.fillStyle = washes[0]
      ctx.fillRect(0, 0, width / 2, height / 2)
      ctx.fillStyle = washes[1]
      ctx.fillRect(width / 2, 0, width / 2, height / 2)
      ctx.fillStyle = washes[2]
      ctx.fillRect(0, height / 2, width / 2, height / 2)
      ctx.fillStyle = washes[3]
      ctx.fillRect(width / 2, height / 2, width / 2, height / 2)
    } else {
      const grad = ctx.createLinearGradient(0, 0, width, height)
      grad.addColorStop(0, '#1B3556')
      grad.addColorStop(0.5, '#24456E')
      grad.addColorStop(1, '#152A45')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)
    }

    // Diagonal denim thread weave lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
    ctx.lineWidth = 1
    for (let i = -height; i < width + height; i += 6) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i - height, height)
      ctx.stroke()
    }

    // Double Orange Contrast Top-Stitching along outer border
    ctx.strokeStyle = '#F59E0B'
    ctx.lineWidth = 2
    ctx.setLineDash([7, 4])
    ctx.strokeRect(10, 10, width - 20, height - 20)
    ctx.strokeRect(15, 15, width - 30, height - 30)
    ctx.setLineDash([])

    // Corner Copper Rivets
    drawCopperRivet(ctx, 22, 22)
    drawCopperRivet(ctx, width - 22, 22)
    drawCopperRivet(ctx, 22, height - 22)
    drawCopperRivet(ctx, width - 22, height - 22)
  } else if (
    frame.illustration === 'newspaper_press' ||
    frame.illustration === 'newspaper_wanted'
  ) {
    // Vintage Newsprint Paper Texture
    ctx.fillStyle = frame.bgColor
    ctx.fillRect(0, 0, width, height)

    // Subtle horizontal paper grain & newsprint column divider lines
    ctx.strokeStyle = 'rgba(24, 24, 27, 0.12)'
    ctx.lineWidth = 1
    for (let y = 110; y < height - 100; y += 16) {
      ctx.beginPath()
      ctx.moveTo(22, y)
      ctx.lineTo(width - 22, y)
      ctx.stroke()
    }

    // Double editorial ink border
    ctx.strokeStyle = '#18181B'
    ctx.lineWidth = 2.5
    ctx.strokeRect(12, 12, width - 24, height - 24)
    ctx.lineWidth = 1
    ctx.strokeRect(16, 16, width - 32, height - 32)
  } else if (frame.illustration === 'y2k_chrome') {
    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, '#E2E8F0')
    grad.addColorStop(0.3, '#94A3B8')
    grad.addColorStop(0.5, '#F8FAFC')
    grad.addColorStop(0.7, '#64748B')
    grad.addColorStop(1, '#CBD5E1')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, width - 20, height - 20)
  } else if (frame.illustration === 'scrapbook_tape') {
    // Notebook grid lines
    ctx.strokeStyle = 'rgba(120, 113, 108, 0.14)'
    ctx.lineWidth = 1
    for (let x = 0; x < width; x += 22) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += 22) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  } else if (frame.illustration === 'ios_music_player') {
    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, '#2E2A3B')
    grad.addColorStop(0.25, '#4F3961')
    grad.addColorStop(0.5, '#253B4E')
    grad.addColorStop(0.75, '#4A2C40')
    grad.addColorStop(1, '#23382F')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    const orbs = [
      { x: width - 30, y: 120, r: 90, color: 'rgba(244, 63, 94, 0.45)' },
      { x: 30, y: 280, r: 95, color: 'rgba(56, 189, 248, 0.4)' },
      { x: width - 25, y: 540, r: 100, color: 'rgba(234, 179, 8, 0.35)' },
      { x: width / 2, y: height - 40, r: 110, color: 'rgba(34, 197, 94, 0.35)' },
    ]
    orbs.forEach((orb) => {
      const rg = ctx.createRadialGradient(orb.x, orb.y, 5, orb.x, orb.y, orb.r)
      rg.addColorStop(0, orb.color)
      rg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = rg
      ctx.fillRect(0, 0, width, height)
    })

    ctx.fillStyle = 'rgba(18, 18, 22, 0.84)'
    drawRoundedRectPath(ctx, 20, 38, width - 40, height - 92, 34)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  } else if (frame.illustration === 'picnic_gingham') {
    const checkerSize = 24
    for (let y = 0; y < 140; y += checkerSize) {
      for (let x = 0; x < width; x += checkerSize) {
        const isEvenX = (x / checkerSize) % 2 === 0
        const isEvenY = (y / checkerSize) % 2 === 0
        if (isEvenX && isEvenY) ctx.fillStyle = '#FFFFFF'
        else if (!isEvenX && !isEvenY) ctx.fillStyle = '#B91C1C'
        else ctx.fillStyle = '#EF4444'
        ctx.fillRect(x, y, checkerSize, checkerSize)
      }
    }
    ctx.fillStyle = '#FEF3C7'
    for (let x = 0; x <= width; x += 28) {
      ctx.beginPath()
      ctx.arc(x, 140, 14, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (frame.illustration === 'cinema_film') {
    ctx.fillStyle = '#09090B'
    ctx.fillRect(0, 0, 36, height)
    ctx.fillRect(width - 36, 0, 36, height)
    ctx.fillStyle = '#F4F4F5'
    for (let y = 20; y < height - 20; y += 34) {
      drawRoundedRectPath(ctx, 9, y, 18, 14, 3)
      ctx.fill()
      drawRoundedRectPath(ctx, width - 27, y, 18, 14, 3)
      ctx.fill()
    }
  } else if (frame.illustration === 'halloween_spooky') {
    const colW = width * 0.56
    ctx.fillStyle = '#F97316'
    ctx.fillRect((width - colW) / 2, 0, colW, height)
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'
    ctx.lineWidth = 1
    const drawWeb = (wx: number, wy: number) => {
      for (let r = 14; r <= 56; r += 14) {
        ctx.beginPath()
        ctx.arc(wx, wy, r, 0, Math.PI * 2)
        ctx.stroke()
      }
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath()
        ctx.moveTo(wx, wy)
        ctx.lineTo(wx + Math.cos(a) * 60, wy + Math.sin(a) * 60)
        ctx.stroke()
      }
    }
    drawWeb(25, 110)
    drawWeb(width - 25, 340)
    drawWeb(20, height - 180)
  } else if (frame.illustration === 'arcade_pixel') {
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, '#2563EB')
    grad.addColorStop(0.65, '#93C5FD')
    grad.addColorStop(1, '#1D4ED8')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#15803D'
    ctx.fillRect(0, height - 85, width, 85)
    ctx.fillStyle = '#22C55E'
    for (let x = 0; x < width; x += 20) {
      ctx.fillRect(x, height - 85, 12, 10)
    }
  } else if (frame.illustration === 'good_vibes') {
    ctx.fillStyle = '#F8C48E'
    drawRoundedRectPath(ctx, 22, 22, width - 44, height - 44, 24)
    ctx.fill()
  }

  ctx.restore()
}

/**
 * Vector foreground illustrations (Zero emojis! Pure vector paths)
 */
function drawFrameForegroundDecor(
  ctx: CanvasRenderingContext2D,
  frame: FrameTemplate,
  width: number,
  height: number
) {
  ctx.save()

  if (frame.illustration === 'denim_jeans' || frame.illustration === 'denim_patchwork') {
    // Red Levi's style woven pocket tab on right margin
    ctx.fillStyle = '#DC2626'
    ctx.fillRect(width - 28, 120, 18, 46)
    ctx.save()
    ctx.translate(width - 19, 143)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '800 8px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('501', 0, 3)
    ctx.restore()

    // Leather waist patch at bottom right
    ctx.fillStyle = '#92400E'
    drawRoundedRectPath(ctx, width - 115, height - 85, 78, 44, 4)
    ctx.fill()
    ctx.strokeStyle = '#F59E0B'
    ctx.lineWidth = 1.2
    ctx.setLineDash([4, 2])
    ctx.strokeRect(width - 112, height - 82, 72, 38)
    ctx.setLineDash([])
    ctx.fillStyle = '#FEF3C7'
    ctx.font = '800 9px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('URBOOTH CO.', width - 76, height - 66)
    ctx.font = '600 8px "JetBrains Mono", monospace'
    ctx.fillText('LOT 501 • W32', width - 76, height - 53)
  } else if (frame.illustration === 'good_vibes') {
    drawDaisyFlower(ctx, width - 38, 185, 22)
    drawDaisyFlower(ctx, 42, height - 155, 22)
    drawVectorHeart(ctx, 40, 32, 26, '#EA580C')
    drawVectorHeart(ctx, width - 42, height - 255, 26, '#EA580C')

    ctx.fillStyle = '#FACC15'
    ctx.strokeStyle = '#18181B'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(36, height * 0.44, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#18181B'
    ctx.beginPath()
    ctx.arc(30, height * 0.44 - 4, 2, 0, Math.PI * 2)
    ctx.arc(42, height * 0.44 - 4, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(36, height * 0.44 + 2, 8, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()
  } else if (frame.illustration === 'maroon_ticket') {
    const bw = width - 80
    const bh = 74
    const bx = 40
    const by = height - 108
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(bx, by, bw, bh)

    ctx.fillStyle = '#18181B'
    for (let x = bx + 14; x < bx + bw - 14; x += 6) {
      const w = x % 12 === 0 ? 3.5 : 1.5
      ctx.fillRect(x, by + 12, w, bh - 24)
    }

    drawVectorStar(ctx, width - 42, 75, 4, 14, 4, '#FFFFFF')
    drawVectorStar(ctx, 42, 45, 4, 10, 3, '#FCA5A5')
  } else if (frame.illustration === 'arcade_pixel') {
    for (let h = 0; h < 3; h++) {
      drawVectorHeart(ctx, 54 + h * 26, 20, 20, '#EF4444')
      drawVectorHeart(ctx, width / 2 + 34 + h * 26, 20, 20, '#EF4444')
    }
  } else if (frame.illustration === 'cute_bunny') {
    const earColor = '#F472B6'
    ctx.fillStyle = earColor
    ctx.beginPath()
    ctx.ellipse(50, 24, 6, 15, -0.15, 0, Math.PI * 2)
    ctx.ellipse(66, 24, 6, 15, 0.15, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(58, 38, 13, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(54, 36, 2, 0, Math.PI * 2)
    ctx.arc(62, 36, 2, 0, Math.PI * 2)
    ctx.fill()

    drawVectorStar(ctx, width - 42, 32, 5, 13, 6, '#FACC15')
    drawVectorHeart(ctx, width - 38, height - 95, 18, '#EC4899')
  } else if (frame.illustration === 'rock_band') {
    // Vector Lightning Bolt
    ctx.fillStyle = '#FACC15'
    ctx.beginPath()
    ctx.moveTo(36, 16)
    ctx.lineTo(24, 34)
    ctx.lineTo(34, 34)
    ctx.lineTo(28, 50)
    ctx.lineTo(44, 30)
    ctx.lineTo(34, 30)
    ctx.closePath()
    ctx.fill()

    drawVectorStar(ctx, width - 40, height - 85, 5, 13, 5, '#EF4444')
    drawVectorStar(ctx, width - 40, 32, 5, 12, 5, '#EF4444')
  } else if (frame.illustration === 'y2k_chrome') {
    drawVectorStar(ctx, 36, 36, 4, 18, 5, '#3B82F6')
    drawVectorStar(ctx, width - 36, height - 90, 4, 18, 5, '#EC4899')
  } else if (frame.illustration === 'band_dongker') {
    // Punk crimson diagonal slash & iconic Dongker vector balaclava mask emblem
    ctx.strokeStyle = '#EF4444'
    ctx.lineWidth = 3
    ctx.strokeRect(12, 12, width - 24, height - 24)

    // Minimalist vector Balaclava / Ski-Mask emblem in top-right
    const mx = width - 46
    const my = 32
    ctx.fillStyle = '#EF4444'
    ctx.beginPath()
    ctx.ellipse(mx, my, 13, 16, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#121214'
    ctx.beginPath()
    ctx.ellipse(mx - 4.5, my - 2, 3.2, 2.2, 0, 0, Math.PI * 2)
    ctx.ellipse(mx + 4.5, my - 2, 3.2, 2.2, 0, 0, Math.PI * 2)
    ctx.ellipse(mx, my + 6, 4.5, 2.5, 0, 0, Math.PI * 2)
    ctx.fill()

    // Punk lightning bolt at bottom-left
    ctx.fillStyle = '#EF4444'
    ctx.beginPath()
    ctx.moveTo(36, height - 108)
    ctx.lineTo(24, height - 88)
    ctx.lineTo(34, height - 88)
    ctx.lineTo(28, height - 70)
    ctx.lineTo(44, height - 92)
    ctx.lineTo(34, height - 92)
    ctx.closePath()
    ctx.fill()
  } else if (frame.illustration === 'band_reality_club') {
    // Vintage Gold Cinema Marquee double-line border + marquee lights
    ctx.strokeStyle = '#F59E0B'
    ctx.lineWidth = 2
    drawRoundedRectPath(ctx, 12, 12, width - 24, height - 24, 18)
    ctx.stroke()
    ctx.lineWidth = 1
    drawRoundedRectPath(ctx, 18, 18, width - 36, height - 36, 14)
    ctx.stroke()

    drawVectorStar(ctx, 36, 36, 4, 12, 4, '#FDE68A')
    drawVectorStar(ctx, width - 36, 36, 4, 12, 4, '#FDE68A')
    drawVectorStar(ctx, 36, height - 85, 4, 12, 4, '#FDE68A')
    drawVectorStar(ctx, width - 36, height - 85, 4, 12, 4, '#FDE68A')
  } else if (frame.illustration === 'band_perunggu') {
    // Warm Bronze metallic industrial double border + equalizer bars
    ctx.strokeStyle = '#CD7F32'
    ctx.lineWidth = 2.5
    ctx.strokeRect(12, 12, width - 24, height - 24)

    // Equalizer bars in bottom-left
    const eqX = 28
    const eqY = height - 78
    const heights = [14, 24, 18, 28, 12, 20]
    ctx.fillStyle = '#CD7F32'
    heights.forEach((h, idx) => {
      ctx.fillRect(eqX + idx * 6, eqY - h, 4, h)
    })

    // "33X" badge in top-right
    ctx.fillStyle = '#CD7F32'
    drawRoundedRectPath(ctx, width - 66, 20, 42, 20, 4)
    ctx.fill()
    ctx.fillStyle = '#1C1917'
    ctx.font = '900 10px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('33X', width - 45, 34)
  } else if (frame.illustration === 'band_lomba_sihir') {
    // Cobalt Blue & Acid Yellow bold urban geometric border + corner stars
    ctx.strokeStyle = '#FACC15'
    ctx.lineWidth = 3
    ctx.strokeRect(12, 12, width - 24, height - 24)

    // Geometric halftone dots in top-right
    ctx.fillStyle = '#FACC15'
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.beginPath()
        ctx.arc(width - 48 + c * 9, 24 + r * 9, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    drawVectorStar(ctx, 36, height - 92, 5, 14, 6, '#FACC15')
    drawVectorStar(ctx, width - 36, height - 92, 5, 14, 6, '#FACC15')
  } else if (frame.illustration === 'band_sore') {
    // Classic Forest Green vintage border + concentric vinyl record emblem
    ctx.strokeStyle = '#1E3A2F'
    ctx.lineWidth = 2
    ctx.strokeRect(14, 14, width - 28, height - 28)

    const vx = width - 44
    const vy = height - 86
    ctx.strokeStyle = '#1E3A2F'
    ctx.lineWidth = 1.2
    for (let r = 8; r <= 20; r += 4) {
      ctx.beginPath()
      ctx.arc(vx, vy, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.fillStyle = '#B45309'
    ctx.beginPath()
    ctx.arc(vx, vy, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ECE7D5'
    ctx.beginPath()
    ctx.arc(vx, vy, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

function drawMusicPlayerFooter(
  ctx: CanvasRenderingContext2D,
  width: number,
  footerStartY: number,
  songTitle: string,
  artistName: string,
  progressRatio = 0.85
) {
  ctx.save()
  const mx = 42
  const innerW = width - mx * 2

  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
  ctx.font = '600 10px "Outfit", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('iPhone', mx, footerStartY + 14)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 15px "Outfit", sans-serif'
  ctx.fillText(songTitle || "You're Gonna Live Forever in Me", mx, footerStartY + 32)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.font = '400 13px "Outfit", sans-serif'
  ctx.fillText(artistName || 'John Mayer — The Search for Everything', mx, footerStartY + 50)

  const barY = footerStartY + 68
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
  drawRoundedRectPath(ctx, mx, barY, innerW, 4, 2)
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  drawRoundedRectPath(ctx, mx, barY, innerW * progressRatio, 4, 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
  ctx.font = '500 9px "JetBrains Mono", monospace'
  ctx.fillText('2:56', mx, barY + 16)
  ctx.textAlign = 'right'
  ctx.fillText('-0:13', width - mx, barY + 16)

  const controlsY = barY + 42
  const centerX = width / 2

  ctx.fillStyle = '#FFFFFF'
  drawRoundedRectPath(ctx, centerX - 8, controlsY - 11, 5, 22, 1.5)
  ctx.fill()
  drawRoundedRectPath(ctx, centerX + 3, controlsY - 11, 5, 22, 1.5)
  ctx.fill()

  const drawTriangle = (tx: number, ty: number, dir: 1 | -1) => {
    ctx.beginPath()
    ctx.moveTo(tx, ty - 8)
    ctx.lineTo(tx + dir * 11, ty)
    ctx.lineTo(tx, ty + 8)
    ctx.closePath()
    ctx.fill()
  }
  ctx.fillStyle = '#FFFFFF'
  drawTriangle(centerX + 46, controlsY, 1)
  drawTriangle(centerX + 57, controlsY, 1)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
  drawTriangle(centerX - 46, controlsY, -1)
  drawTriangle(centerX - 57, controlsY, -1)

  // Vector speaker icons + Volume slider (No emojis!)
  const volY = controlsY + 34
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
  // Left small speaker polygon
  ctx.beginPath()
  ctx.moveTo(mx, volY - 3)
  ctx.lineTo(mx + 4, volY - 3)
  ctx.lineTo(mx + 8, volY - 7)
  ctx.lineTo(mx + 8, volY + 7)
  ctx.lineTo(mx + 4, volY + 3)
  ctx.lineTo(mx, volY + 3)
  ctx.closePath()
  ctx.fill()

  // Right loud speaker polygon + waves
  const rx = width - mx - 10
  ctx.beginPath()
  ctx.moveTo(rx, volY - 3)
  ctx.lineTo(rx + 4, volY - 3)
  ctx.lineTo(rx + 8, volY - 7)
  ctx.lineTo(rx + 8, volY + 7)
  ctx.lineTo(rx + 4, volY + 3)
  ctx.lineTo(rx, volY + 3)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.arc(rx + 8, volY, 4, -0.35 * Math.PI, 0.35 * Math.PI)
  ctx.stroke()

  const volTrackX = mx + 20
  const volTrackW = innerW - 40
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
  drawRoundedRectPath(ctx, volTrackX, volY - 2, volTrackW, 4, 2)
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  drawRoundedRectPath(ctx, volTrackX, volY - 2, volTrackW * 0.78, 4, 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(volTrackX + volTrackW * 0.78, volY, 7, 0, Math.PI * 2)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()

  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
  ctx.font = '600 13px "Outfit", sans-serif'
  ctx.fillText('urbooth', width / 2, volY + 36)

  ctx.restore()
}

function getVideoFilterCss(vf?: VideoFilterId): string {
  switch (vf) {
    case 'bw':
      return 'grayscale(1) contrast(1.15)'
    case 'sepia':
      return 'sepia(0.85) contrast(1.05)'
    case 'negative':
      return 'invert(1) hue-rotate(180deg)'
    case 'blur':
      return 'blur(3px) brightness(1.05)'
    case 'warm':
      return 'sepia(0.3) saturate(1.3) brightness(1.05)'
    case 'cyber':
      return 'hue-rotate(175deg) saturate(1.2) contrast(1.1)'
    case 'vintage':
      return 'sepia(0.45) contrast(0.9) brightness(1.05)'
    default:
      return 'none'
  }
}

export function getFrameDimensions(frame: FrameTemplate) {
  const cols = frame.cols || 1
  const rows = frame.rows || frame.slots
  const isMusicPlayer = frame.illustration === 'ios_music_player'
  const isNewspaper =
    frame.illustration === 'newspaper_press' || frame.illustration === 'newspaper_wanted'
  const isMemeGrid = frame.illustration === 'meme_white_grid'

  let baseWidth = 420
  let basePhotoWidth = 336
  let basePhotoHeight = basePhotoWidth / frame.aspectRatio
  let marginX = 42
  let marginY = 18
  let gap = 12
  let headerHeight = isMusicPlayer ? 42 : isNewspaper ? 92 : 60
  let footerHeight = isMusicPlayer ? 185 : isNewspaper ? 145 : 130

  if (isMemeGrid) {
    baseWidth = 640
    basePhotoWidth = 266
    basePhotoHeight = 266
    marginX = 44
    marginY = 12
    gap = 20
    headerHeight = 56
    footerHeight = 68
  } else if (cols === 2) {
    baseWidth = 660
    basePhotoWidth = 278
    basePhotoHeight = basePhotoWidth / frame.aspectRatio
    marginX = 42
    marginY = 24
    gap = 20
    headerHeight = isNewspaper ? 96 : 64
    footerHeight = isNewspaper ? 140 : 125
  } else if (frame.slots === 1) {
    baseWidth = 520
    basePhotoWidth = 430
    basePhotoHeight = basePhotoWidth / frame.aspectRatio
    marginX = 45
    marginY = 24
    gap = 0
    headerHeight = 56
    footerHeight = 115
  }

  if (frame.illustration === 'halloween_spooky') {
    basePhotoWidth = 210
    basePhotoHeight = 170
    marginX = (baseWidth - basePhotoWidth) / 2
  } else if (frame.illustration === 'maroon_ticket') {
    basePhotoWidth = 290
    basePhotoHeight = 195
    marginX = (baseWidth - basePhotoWidth) / 2
    headerHeight = 95
  }

  const totalHeight =
    headerHeight + marginY + basePhotoHeight * rows + gap * (rows - 1) + marginY + footerHeight

  return {
    baseWidth,
    totalHeight,
    basePhotoWidth,
    basePhotoHeight,
    marginX,
    marginY,
    gap,
    headerHeight,
    footerHeight,
    cols,
    rows,
  }
}

export function drawCompositeOnCanvas(
  canvas: HTMLCanvasElement,
  loadedImages: (MediaSource | null)[],
  options: RenderOptions & {
    animProgress?: number
    zoomPerSlot?: number[]
    loadedStickerMap?: Map<string, HTMLImageElement>
  }
) {
  const {
    frame,
    filterId,
    caption = '',
    venue = frame.defaultVenue,
    showDate = true,
    customDate,
    scale = 2,
    showStickers = true,
    placedStickers = [],
    videoFilter = 'normal',
    animProgress = 0.85,
    zoomPerSlot,
    loadedStickerMap,
    fastPreview = false,
    mirrorVideo = false,
  } = options

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // ==================== EXACT IMAGE TEMPLATE MODE ====================
  if (frame.imageTemplateUrl && frame.customSlots && frame.customSlots.length > 0) {
    const tplImg =
      loadedStickerMap?.get(frame.imageTemplateUrl) ||
      imageElementCache.get(frame.imageTemplateUrl)

    const naturalRatio = tplImg && tplImg.height > 0 ? tplImg.width / tplImg.height : 600 / 900
    const baseH = 900
    const baseW = Math.max(240, Math.round(baseH * naturalRatio))

    if (canvas.width !== baseW * scale || canvas.height !== baseH * scale) {
      canvas.width = baseW * scale
      canvas.height = baseH * scale
    }

    ctx.save()
    ctx.scale(scale, scale)

    const currentFilter = PHOTO_FILTERS.find((f) => f.id === filterId) || PHOTO_FILTERS[0]
    const videoCss = getVideoFilterCss(videoFilter)
    const activeCssFilter =
      videoCss !== 'none'
        ? videoCss
        : fastPreview && currentFilter.cssFilter && currentFilter.cssFilter !== 'none'
        ? currentFilter.cssFilter
        : 'none'

    // Generate/fetch pixel-perfect transparent-cutout overlay so photos sit BEHIND stars/dragons/vines/borders!
    const cutoutCanvas = tplImg
      ? getCutoutTemplateCanvas(frame.id, tplImg, frame.customSlots)
      : null

    if (cutoutCanvas) {
      // Clear background with frame bgColor, draw user photos BEHIND the cutout, then stamp cutout ON TOP!
      ctx.fillStyle = frame.bgColor
      ctx.fillRect(0, 0, baseW, baseH)
    } else if (tplImg) {
      ctx.drawImage(tplImg, 0, 0, baseW, baseH)
    } else {
      ctx.fillStyle = frame.bgColor
      ctx.fillRect(0, 0, baseW, baseH)
    }

    frame.customSlots.forEach((slot, i) => {
      const img = loadedImages[i]
      if (!img) return

      // When using pixel-perfect cutout overlay, bleed photo slightly (+8%) so irregular ears/hex/stars have zero gaps
      const bleedX = cutoutCanvas ? slot.w * 0.08 : 0
      const bleedY = cutoutCanvas ? slot.h * 0.08 : 0
      const sx = (slot.x - bleedX) * baseW
      const sy = (slot.y - bleedY) * baseH
      const sw = (slot.w + bleedX * 2) * baseW
      const sh = (slot.h + bleedY * 2) * baseH
      const r = cutoutCanvas ? 0 : slot.radius || 0
      const rot = slot.rotation || 0
      const slotShape = cutoutCanvas ? 'rect' : slot.shape || (r > 0 ? 'rounded' : 'rect')
      const zoom = zoomPerSlot?.[i] || 1

      const clipSlotLocal = (targetCtx: CanvasRenderingContext2D, lx: number, ly: number) => {
        if (slotShape === 'oval') {
          targetCtx.beginPath()
          targetCtx.ellipse(lx + sw / 2, ly + sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2)
          targetCtx.closePath()
        } else if (slotShape === 'heart') {
          drawHeartClipPath(targetCtx, lx, ly, sw, sh)
        } else if (r > 0 || slotShape === 'rounded') {
          drawRoundedRectPath(targetCtx, lx, ly, sw, sh, r > 0 ? r : 10)
        } else {
          targetCtx.beginPath()
          targetCtx.rect(lx, ly, sw, sh)
          targetCtx.closePath()
        }
      }

      // Fast GPU path for live video/drag preview (zero getImageData stall!)
      if (fastPreview || !currentFilter.canvasProcess || videoFilter !== 'normal') {
        const shouldMirror = mirrorVideo && img instanceof HTMLVideoElement
        ctx.save()
        if (rot !== 0) {
          ctx.translate(sx + sw / 2, sy + sh / 2)
          ctx.rotate((rot * Math.PI) / 180)
          clipSlotLocal(ctx, -sw / 2, -sh / 2)
          ctx.clip()
          if (activeCssFilter !== 'none') ctx.filter = activeCssFilter
          drawImageCoverInShape(ctx, img, -sw / 2, -sh / 2, sw, sh, 'rect', zoom, shouldMirror)
          ctx.filter = 'none'
        } else {
          clipSlotLocal(ctx, sx, sy)
          ctx.clip()
          if (activeCssFilter !== 'none') ctx.filter = activeCssFilter
          drawImageCoverInShape(ctx, img, sx, sy, sw, sh, 'rect', zoom, shouldMirror)
          ctx.filter = 'none'
        }
        ctx.restore()
        return
      }

      // High-precision static/export path with full pixel filter processing
      const ow = Math.max(1, Math.round(sw * scale))
      const oh = Math.max(1, Math.round(sh * scale))
      const offCanvas = getSharedOffscreenCanvas(ow, oh)
      const offCtx = offCanvas.getContext('2d')

      if (offCtx) {
        offCtx.setTransform(1, 0, 0, 1, 0, 0)
        offCtx.clearRect(0, 0, ow, oh)
        offCtx.scale(scale, scale)
        drawImageCoverInShape(offCtx, img, 0, 0, sw, sh, 'rect', zoom)
        currentFilter.canvasProcess(offCtx, ow, oh)

        ctx.save()
        if (rot !== 0) {
          ctx.translate(sx + sw / 2, sy + sh / 2)
          ctx.rotate((rot * Math.PI) / 180)
          clipSlotLocal(ctx, -sw / 2, -sh / 2)
          ctx.clip()
          ctx.drawImage(offCanvas, -sw / 2, -sh / 2, sw, sh)
        } else {
          clipSlotLocal(ctx, sx, sy)
          ctx.clip()
          ctx.drawImage(offCanvas, sx, sy, sw, sh)
        }
        ctx.restore()
      }
    })

    // Stamp pixel-perfect transparent-cutout frame artwork ON TOP of the user's photos!
    if (cutoutCanvas) {
      ctx.drawImage(cutoutCanvas, 0, 0, baseW, baseH)
    }

    // Draw Placed Cutout Meme Stickers on top of exact image template
    if (showStickers && placedStickers.length > 0) {
      placedStickers.forEach((st) => {
        const stImg =
          loadedStickerMap?.get(st.imageUrl) || imageElementCache.get(st.imageUrl)
        if (!stImg) return
        const cx = baseW * st.xRatio
        const cy = baseH * st.yRatio
        const baseSize = 86 * st.scale
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate((st.rotation * Math.PI) / 180)
        ctx.drawImage(stImg, -baseSize / 2, -baseSize / 2, baseSize, baseSize)
        ctx.restore()
      })
    }

    ctx.restore()
    return
  }

  const dims = getFrameDimensions(frame)
  const {
    baseWidth,
    totalHeight,
    basePhotoWidth,
    basePhotoHeight,
    marginX,
    marginY,
    gap,
    headerHeight,
    footerHeight,
    cols,
  } = dims

  const isMusicPlayer = frame.illustration === 'ios_music_player'
  const isNewspaper =
    frame.illustration === 'newspaper_press' || frame.illustration === 'newspaper_wanted'
  const isDenim =
    frame.illustration === 'denim_jeans' || frame.illustration === 'denim_patchwork'
  const isMemeGrid = frame.illustration === 'meme_white_grid'

  if (canvas.width !== baseWidth * scale || canvas.height !== totalHeight * scale) {
    canvas.width = baseWidth * scale
    canvas.height = totalHeight * scale
  }

  ctx.save()
  ctx.scale(scale, scale)

  // 1. Base Background
  ctx.fillStyle = frame.bgColor
  ctx.fillRect(0, 0, baseWidth, totalHeight)

  // 2. Background Theme Graphics
  drawFrameBackgroundDecor(ctx, frame, baseWidth, totalHeight)

  // 3. Header Section
  if (isMemeGrid) {
    // Cursive serif "urbooth" in top-right of right column like "fotopix" in user's screenshot!
    ctx.save()
    ctx.fillStyle = '#18181B'
    ctx.font = 'italic 600 20px "Georgia", serif'
    ctx.textAlign = 'center'
    ctx.fillText('urbooth', marginX + basePhotoWidth + gap + basePhotoWidth / 2, 36)
    ctx.restore()
  } else if (isNewspaper) {
    ctx.save()
    ctx.fillStyle = '#18181B'
    ctx.textAlign = 'center'
    ctx.font = '900 26px "Georgia", "Times New Roman", serif'
    ctx.fillText('THE URBOOTH DAILY PRESS', baseWidth / 2, 42)

    ctx.strokeStyle = '#18181B'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(24, 54)
    ctx.lineTo(baseWidth - 24, 54)
    ctx.moveTo(24, 74)
    ctx.lineTo(baseWidth - 24, 74)
    ctx.stroke()

    ctx.font = '700 9px "JetBrains Mono", monospace'
    ctx.fillText(
      'VOL. XXIV • JAKARTA SPECIAL EDITION • EXCLUSIVE HEADLINE REPORT • 50¢',
      baseWidth / 2,
      67
    )
    ctx.restore()
  } else if (!isMusicPlayer) {
    ctx.save()
    ctx.fillStyle = frame.textColor
    if (frame.illustration === 'maroon_ticket') {
      ctx.font = '700 32px "Handflair", "Caveat", cursive'
      ctx.textAlign = 'center'
      ctx.fillText('Capturing', baseWidth / 2, 38)
      ctx.fillText('Moments', baseWidth / 2, 68)
    } else {
      ctx.font = '800 24px "Handflair", "Caveat", cursive'
      ctx.textBaseline = 'middle'
      ctx.fillText('urbooth', marginX, headerHeight / 2 + 4)

      ctx.font = '600 10px "JetBrains Mono", monospace'
      ctx.fillStyle = frame.accentColor
      ctx.textAlign = 'right'
      ctx.fillText(`${frame.code} • ${frame.slots} PHOTOS`, baseWidth - marginX, headerHeight / 2 + 4)
    }
    ctx.restore()
  }

  // 4. Photo Slots
  const currentFilter = PHOTO_FILTERS.find((f) => f.id === filterId) || PHOTO_FILTERS[0]
  const shape = frame.slotShape || 'rect'
  const videoCss = getVideoFilterCss(videoFilter)

  for (let i = 0; i < frame.slots; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const slotX = marginX + col * (basePhotoWidth + gap)
    const slotY = headerHeight + marginY + row * (basePhotoHeight + gap)

    ctx.save()
    drawSlotPath(ctx, slotX, slotY, basePhotoWidth, basePhotoHeight, shape)
    ctx.fillStyle =
      frame.illustration === 'halloween_spooky'
        ? '#18181B'
        : frame.illustration === 'maroon_ticket'
        ? '#881D1D'
        : frame.illustration === 'good_vibes'
        ? '#F6B47B'
        : isDenim
        ? '#13263E'
        : isNewspaper
        ? '#D6CFC0'
        : isMusicPlayer
        ? '#23252F'
        : '#E4E4E7'
    ctx.fill()
    ctx.restore()

    const img = loadedImages[i]
    if (img) {
      const zoom = zoomPerSlot?.[i] || 1
      const shouldMirror = mirrorVideo && img instanceof HTMLVideoElement
      const activeCss =
        videoCss !== 'none'
          ? videoCss
          : fastPreview && currentFilter.cssFilter && currentFilter.cssFilter !== 'none'
          ? currentFilter.cssFilter
          : 'none'

      if (fastPreview || !currentFilter.canvasProcess || videoFilter !== 'normal') {
        ctx.save()
        if (activeCss !== 'none') ctx.filter = activeCss
        drawImageCoverInShape(
          ctx,
          img,
          slotX,
          slotY,
          basePhotoWidth,
          basePhotoHeight,
          shape,
          zoom,
          shouldMirror
        )
        ctx.filter = 'none'
        ctx.restore()
      } else {
        const ow = Math.max(1, Math.round(basePhotoWidth * scale))
        const oh = Math.max(1, Math.round(basePhotoHeight * scale))
        const offCanvas = getSharedOffscreenCanvas(ow, oh)
        const offCtx = offCanvas.getContext('2d')

        if (offCtx) {
          offCtx.setTransform(1, 0, 0, 1, 0, 0)
          offCtx.clearRect(0, 0, ow, oh)
          offCtx.scale(scale, scale)
          drawImageCoverInShape(offCtx, img, 0, 0, basePhotoWidth, basePhotoHeight, 'rect', zoom, shouldMirror)
          currentFilter.canvasProcess(offCtx, ow, oh)

          ctx.save()
          drawSlotPath(ctx, slotX, slotY, basePhotoWidth, basePhotoHeight, shape)
          ctx.clip()
          ctx.drawImage(offCanvas, slotX, slotY, basePhotoWidth, basePhotoHeight)
          ctx.restore()
        }
      }
    } else {
      ctx.save()
      ctx.font = '900 54px "Outfit", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const numStr = `${i + 1}`
      const cx = slotX + basePhotoWidth / 2
      const cy = slotY + basePhotoHeight / 2

      ctx.strokeStyle = '#18181B'
      ctx.lineWidth = 5
      ctx.strokeText(numStr, cx, cy)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText(numStr, cx, cy)
      ctx.restore()
    }

    // Custom Slot Borders per Theme
    if (isDenim) {
      ctx.save()
      ctx.strokeStyle = '#F59E0B'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 3])
      ctx.strokeRect(slotX - 2, slotY - 2, basePhotoWidth + 4, basePhotoHeight + 4)
      ctx.setLineDash([])
      drawCopperRivet(ctx, slotX, slotY)
      drawCopperRivet(ctx, slotX + basePhotoWidth, slotY)
      ctx.restore()
    } else if (frame.illustration === 'scrapbook_tape') {
      // Washi masking tape strips at top-left and bottom-right of each photo
      ctx.save()
      ctx.fillStyle = 'rgba(245, 158, 11, 0.45)'
      ctx.translate(slotX + 12, slotY + 4)
      ctx.rotate(-0.35)
      ctx.fillRect(-22, -7, 44, 14)
      ctx.restore()

      ctx.save()
      ctx.fillStyle = 'rgba(245, 158, 11, 0.45)'
      ctx.translate(slotX + basePhotoWidth - 12, slotY + basePhotoHeight - 4)
      ctx.rotate(-0.35)
      ctx.fillRect(-22, -7, 44, 14)
      ctx.restore()
    } else if (!isMusicPlayer && !isMemeGrid) {
      ctx.save()
      drawSlotPath(ctx, slotX, slotY, basePhotoWidth, basePhotoHeight, shape)
      ctx.strokeStyle =
        frame.illustration === 'maroon_ticket' ? '#FFFFFF' : frame.subtleBorderColor
      ctx.lineWidth = frame.illustration === 'maroon_ticket' ? 3 : isNewspaper ? 2 : 1.5
      ctx.stroke()
      ctx.restore()
    }
  }

  // 5. Foreground Theme Vector Decorations
  drawFrameForegroundDecor(ctx, frame, baseWidth, totalHeight)

  // 5.5 Optional Custom Transparent PNG Overlay (uploaded by User or Admin!)
  if (frame.customOverlayUrl) {
    const overlayImg =
      loadedStickerMap?.get(frame.customOverlayUrl) ||
      imageElementCache.get(frame.customOverlayUrl)
    if (overlayImg) {
      ctx.drawImage(overlayImg, 0, 0, baseWidth, totalHeight)
    }
  }

  // 6. Placed Cutout Meme Stickers (Draggable, Resizable, Rotatable!)
  if (showStickers && placedStickers.length > 0) {
    placedStickers.forEach((st) => {
      const stImg =
        loadedStickerMap?.get(st.imageUrl) || imageElementCache.get(st.imageUrl)
      if (!stImg) return

      const cx = baseWidth * st.xRatio
      const cy = totalHeight * st.yRatio
      const baseSize = 86 * st.scale

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate((st.rotation * Math.PI) / 180)
      ctx.drawImage(stImg, -baseSize / 2, -baseSize / 2, baseSize, baseSize)
      ctx.restore()
    })
  }

  // 7. Footer Section
  const footerStartY = totalHeight - footerHeight
  const dateStr =
    customDate ||
    new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  if (isMemeGrid) {
    // Bottom-left "urbooth" cursive serif watermark matching "fotopix" in user's screenshot!
    ctx.save()
    ctx.fillStyle = '#18181B'
    ctx.font = 'italic 600 20px "Georgia", serif'
    ctx.textAlign = 'center'
    ctx.fillText('urbooth', marginX + basePhotoWidth / 2, totalHeight - 26)
    ctx.restore()
  } else if (isMusicPlayer) {
    drawMusicPlayerFooter(
      ctx,
      baseWidth,
      footerStartY,
      venue || frame.defaultVenue,
      caption || frame.defaultArtist || 'John Mayer — The Search for Everything',
      animProgress
    )
  } else if (isNewspaper) {
    ctx.save()
    ctx.fillStyle = '#18181B'
    ctx.strokeStyle = '#18181B'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(24, footerStartY + 12)
    ctx.lineTo(baseWidth - 24, footerStartY + 12)
    ctx.stroke()

    ctx.font = '900 20px "Georgia", serif'
    ctx.textAlign = 'left'
    ctx.fillText((venue || 'BREAKING NEWS: BEST MOMENTS').toUpperCase(), 26, footerStartY + 38)

    ctx.font = '400 10px "Georgia", serif'
    ctx.fillText(
      caption ||
        'Exclusive photographs captured live at the Urbooth Press Bureau. Witnesses report extraordinary style.',
      26,
      footerStartY + 56
    )
    ctx.fillText(
      `Published on ${dateStr.toUpperCase()} • Editorial Archive Bureau • Page A1`,
      26,
      footerStartY + 72
    )

    // Newspaper Barcode on bottom right
    for (let x = baseWidth - 110; x < baseWidth - 28; x += 4) {
      ctx.fillRect(x, footerStartY + 84, x % 8 === 0 ? 2.5 : 1, 24)
    }
    ctx.font = '700 10px "JetBrains Mono", monospace'
    ctx.fillText('ISSN 2026-501X • URBOOTH PRESS', 26, footerStartY + 102)
    ctx.restore()
  } else if (frame.illustration !== 'maroon_ticket') {
    ctx.save()
    ctx.textAlign = 'center'

    if (frame.illustration === 'good_vibes') {
      ctx.font = '900 32px "Archivo Black", "Outfit", sans-serif'
      ctx.fillStyle = '#FFFFFF'
      ctx.strokeStyle = '#C2410C'
      ctx.lineWidth = 4
      ctx.strokeText(venue.toUpperCase(), baseWidth / 2, footerStartY + 52)
      ctx.fillText(venue.toUpperCase(), baseWidth / 2, footerStartY + 52)
    } else {
      ctx.fillStyle = frame.textColor
      ctx.font = '800 22px "Outfit", sans-serif'
      ctx.fillText(venue, baseWidth / 2, footerStartY + 42)
    }

    if (caption && caption.trim().length > 0) {
      ctx.font = '600 16px "Handflair", "Caveat", cursive'
      ctx.fillStyle = frame.accentColor
      ctx.fillText(`"${caption}"`, baseWidth / 2, footerStartY + 68)
    }

    if (showDate) {
      ctx.font = '500 10px "JetBrains Mono", monospace'
      ctx.fillStyle = frame.textColor
      ctx.globalAlpha = 0.75
      ctx.fillText(`${dateStr.toUpperCase()} • URBOOTH.ID`, baseWidth / 2, footerStartY + 94)
    }
    ctx.restore()
  }

  ctx.restore()
}

export async function renderCompositeCanvas(options: RenderOptions): Promise<string> {
  const loadedImages: (HTMLImageElement | null)[] = await Promise.all(
    Array.from({ length: options.frame.slots }).map(async (_, idx) => {
      const shot = options.shots[idx]
      if (!shot) return null
      try {
        return await loadImage(shot)
      } catch {
        return null
      }
    })
  )

  const stickerMap = new Map<string, HTMLImageElement>()
  if (options.frame.imageTemplateUrl) {
    try {
      const tplImg = await loadImage(options.frame.imageTemplateUrl)
      stickerMap.set(options.frame.imageTemplateUrl, tplImg)
    } catch {
      // ignore
    }
  }
  if (options.frame.customOverlayUrl) {
    try {
      const ovImg = await loadImage(options.frame.customOverlayUrl)
      stickerMap.set(options.frame.customOverlayUrl, ovImg)
    } catch {
      // ignore
    }
  }
  if (options.placedStickers && options.placedStickers.length > 0) {
    await Promise.all(
      options.placedStickers.map(async (st) => {
        try {
          const img = await loadImage(st.imageUrl)
          stickerMap.set(st.imageUrl, img)
        } catch {
          // ignore
        }
      })
    )
  }

  const canvas = document.createElement('canvas')
  drawCompositeOnCanvas(canvas, loadedImages, {
    ...options,
    loadedStickerMap: stickerMap,
  })
  return canvas.toDataURL('image/png', 0.96)
}

/**
 * Pure frameless Timelapse renderer (Photo/Video only without any frame border!)
 */
export function drawFramelessTimelapseOnCanvas(
  canvas: HTMLCanvasElement,
  img: MediaSource | null,
  filterId: FilterId,
  videoFilter: VideoFilterId = 'normal',
  zoomFactor = 1,
  fastPreview = true,
  mirrorVideo = false
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const targetW = 720
  const targetH = 540
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW
    canvas.height = targetH
  }

  ctx.fillStyle = '#09090C'
  ctx.fillRect(0, 0, targetW, targetH)

  if (!img) return

  const currentFilter = PHOTO_FILTERS.find((f) => f.id === filterId) || PHOTO_FILTERS[0]
  const videoCss = getVideoFilterCss(videoFilter)
  const activeCss =
    videoCss !== 'none'
      ? videoCss
      : fastPreview && currentFilter.cssFilter && currentFilter.cssFilter !== 'none'
      ? currentFilter.cssFilter
      : 'none'
  const shouldMirror = mirrorVideo && img instanceof HTMLVideoElement

  ctx.save()
  if (activeCss !== 'none') {
    ctx.filter = activeCss
  }
  drawImageCoverInShape(ctx, img, 0, 0, targetW, targetH, 'rect', zoomFactor, shouldMirror)
  ctx.filter = 'none'
  ctx.restore()

  if (!fastPreview && videoFilter === 'normal' && currentFilter.canvasProcess) {
    currentFilter.canvasProcess(ctx, targetW, targetH)
  }
}
