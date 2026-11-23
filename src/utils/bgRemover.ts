/**
 * Client-side automatic background remover for custom uploaded stickers.
 * Samples the 4 corners of the uploaded image to detect the background color
 * and performs a smooth edge-aware flood-fill + chroma threshold removal.
 */
export function removeBackgroundFromDataUrl(
  dataUrl: string,
  tolerance = 48
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxDim = 512
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imgData.data
      const w = canvas.width
      const h = canvas.height

      // Sample top-left, top-right, bottom-left, bottom-right corner colors
      const corners = [
        0,
        (w - 1) * 4,
        (h - 1) * w * 4,
        ((h - 1) * w + (w - 1)) * 4,
      ]

      let bgR = 0
      let bgG = 0
      let bgB = 0
      corners.forEach((idx) => {
        bgR += data[idx]
        bgG += data[idx + 1]
        bgB += data[idx + 2]
      })
      bgR /= 4
      bgG /= 4
      bgB /= 4

      // Flood-fill from image edges so we only remove background connected to borders
      const visited = new Uint8Array(w * h)
      const queue: number[] = []

      const colorDist = (idx4: number) => {
        const dr = data[idx4] - bgR
        const dg = data[idx4 + 1] - bgG
        const db = data[idx4 + 2] - bgB
        return Math.sqrt(dr * dr + dg * dg + db * db)
      }

      // Seed border pixels
      for (let x = 0; x < w; x++) {
        queue.push(x)
        queue.push((h - 1) * w + x)
      }
      for (let y = 0; y < h; y++) {
        queue.push(y * w)
        queue.push(y * w + (w - 1))
      }

      let head = 0
      while (head < queue.length) {
        const pos = queue[head++]
        if (visited[pos]) continue
        visited[pos] = 1

        const idx4 = pos * 4
        const dist = colorDist(idx4)

        if (dist <= tolerance) {
          data[idx4 + 3] = 0 // Transparent!
          const px = pos % w
          const py = Math.floor(pos / w)

          if (px > 0 && !visited[pos - 1]) queue.push(pos - 1)
          if (px < w - 1 && !visited[pos + 1]) queue.push(pos + 1)
          if (py > 0 && !visited[pos - w]) queue.push(pos - w)
          if (py < h - 1 && !visited[pos + w]) queue.push(pos + w)
        } else if (dist <= tolerance + 22) {
          // Soft anti-aliased edge feathering
          const alphaFactor = (dist - tolerance) / 22
          data[idx4 + 3] = Math.round(data[idx4 + 3] * alphaFactor)
        }
      }

      ctx.putImageData(imgData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = (err) => reject(err)
    img.src = dataUrl
  })
}
