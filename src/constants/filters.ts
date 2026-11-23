import type { FilterCategory, PhotoFilter } from '../types'

interface FilterGradeSpec {
  id: string
  name: string
  category: FilterCategory
  description: string
  previewColor: string
  cssFilter: string
  rMul?: number
  gMul?: number
  bMul?: number
  rAdd?: number
  gAdd?: number
  bAdd?: number
  contrast?: number // 1.0 = normal
  saturation?: number // 1.0 = normal, 0 = grayscale
  sepia?: number // 0..1
  fade?: number // 0..45 lifted blacks
  invert?: boolean
  duotone?: [number, number, number, number, number, number] // dark R,G,B -> light R,G,B
}

function createGradeProcessor(spec: FilterGradeSpec) {
  return (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imgData = ctx.getImageData(0, 0, width, height)
    const d = imgData.data

    const rMul = spec.rMul ?? 1
    const gMul = spec.gMul ?? 1
    const bMul = spec.bMul ?? 1
    const rAdd = spec.rAdd ?? 0
    const gAdd = spec.gAdd ?? 0
    const bAdd = spec.bAdd ?? 0
    const contrast = spec.contrast ?? 1
    const sat = spec.saturation ?? 1
    const sepia = spec.sepia ?? 0
    const fade = spec.fade ?? 0
    const invert = spec.invert ?? false
    const duo = spec.duotone

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i]
      let g = d[i + 1]
      let b = d[i + 2]

      if (invert) {
        r = 255 - r
        g = 255 - g
        b = 255 - b
      }

      // Saturation
      if (sat !== 1) {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        r = lum + (r - lum) * sat
        g = lum + (g - lum) * sat
        b = lum + (b - lum) * sat
      }

      // Sepia mix
      if (sepia > 0) {
        const sr = 0.393 * r + 0.769 * g + 0.189 * b
        const sg = 0.349 * r + 0.686 * g + 0.168 * b
        const sb = 0.272 * r + 0.534 * g + 0.131 * b
        r = r * (1 - sepia) + sr * sepia
        g = g * (1 - sepia) + sg * sepia
        b = b * (1 - sepia) + sb * sepia
      }

      // Channel multipliers & offsets
      r = r * rMul + rAdd
      g = g * gMul + gAdd
      b = b * bMul + bAdd

      // Contrast
      if (contrast !== 1) {
        r = (r - 128) * contrast + 128
        g = (g - 128) * contrast + 128
        b = (b - 128) * contrast + 128
      }

      // Fade lifted shadows
      if (fade > 0) {
        r = r * (1 - fade / 255) + fade
        g = g * (1 - fade / 255) + fade
        b = b * (1 - fade / 255) + fade
      }

      // Duotone mapping
      if (duo) {
        const lumNorm = Math.min(1, Math.max(0, (0.299 * r + 0.587 * g + 0.114 * b) / 255))
        r = duo[0] + (duo[3] - duo[0]) * lumNorm
        g = duo[1] + (duo[4] - duo[1]) * lumNorm
        b = duo[2] + (duo[5] - duo[2]) * lumNorm
      }

      d[i] = Math.min(255, Math.max(0, r))
      d[i + 1] = Math.min(255, Math.max(0, g))
      d[i + 2] = Math.min(255, Math.max(0, b))
    }

    ctx.putImageData(imgData, 0, 0)
  }
}

const FILTER_SPECS: FilterGradeSpec[] = [
  // ==================== 1. STUDIO & BEAUTY (14 FILTERS) ====================
  { id: 'natural', name: '01. Normal Truth', category: 'Studio & Beauty', description: 'Warna asli kamera jernih tanpa distorsi.', previewColor: '#6366F1', cssFilter: 'none' },
  { id: 'bright_soft', name: '02. Korean Soft Bright', category: 'Studio & Beauty', description: 'Kulit cerah halus ala photobooth Seoul.', previewColor: '#F472B6', cssFilter: 'brightness(1.1) contrast(0.95) saturate(1.06)', rMul: 1.08, gMul: 1.07, bMul: 1.08, rAdd: 8, gAdd: 6, bAdd: 8, contrast: 0.96 },
  { id: 'glass_skin', name: '03. Glass Skin Dewy', category: 'Studio & Beauty', description: 'Highlight wajah berkilau dengan rona sehat.', previewColor: '#FB7185', cssFilter: 'brightness(1.12) contrast(1.04) saturate(1.08)', rMul: 1.1, gMul: 1.08, bMul: 1.09, rAdd: 10, gAdd: 8, bAdd: 10, contrast: 1.04 },
  { id: 'peach_skin', name: '04. Peach Milk', category: 'Studio & Beauty', description: 'Undertone peach lembut yang manis di kulit.', previewColor: '#FDBA74', cssFilter: 'brightness(1.07) saturate(1.14) hue-rotate(-5deg)', rMul: 1.12, gMul: 1.04, bMul: 1.01, rAdd: 10, gAdd: 4, bAdd: 2 },
  { id: 'porcelain', name: '05. Porcelain Doll', category: 'Studio & Beauty', description: 'Putih bersih porselen dengan saturasi kalem.', previewColor: '#E2E8F0', cssFilter: 'brightness(1.14) saturate(0.88) contrast(0.96)', rMul: 1.1, gMul: 1.1, bMul: 1.12, rAdd: 12, gAdd: 12, bAdd: 14, saturation: 0.88 },
  { id: 'rosy_cheek', name: '06. Rosy Blush', category: 'Studio & Beauty', description: 'Sentuhan pink merona di pipi dan bibir.', previewColor: '#F43F5E', cssFilter: 'brightness(1.05) saturate(1.18) hue-rotate(-8deg)', rMul: 1.13, gMul: 1.01, bMul: 1.06, rAdd: 8, bAdd: 6 },
  { id: 'ivory_matte', name: '07. Ivory Matte', category: 'Studio & Beauty', description: 'Kulit ivory dengan shadow lembut matte.', previewColor: '#FDE68A', cssFilter: 'brightness(1.08) contrast(0.92)', rMul: 1.07, gMul: 1.06, bMul: 1.03, fade: 16, contrast: 0.94 },
  { id: 'k_idol', name: '08. K-Idol Stage', category: 'Studio & Beauty', description: 'Kontras bersih dan warna pop cerah seperti panggung idol.', previewColor: '#EC4899', cssFilter: 'brightness(1.08) contrast(1.08) saturate(1.16)', rMul: 1.08, gMul: 1.06, bMul: 1.09, saturation: 1.16, contrast: 1.08 },
  { id: 'silk_portrait', name: '09. Silk Studio', category: 'Studio & Beauty', description: 'Transisi bayangan sehalus sutra.', previewColor: '#C084FC', cssFilter: 'brightness(1.06) contrast(0.94) saturate(1.02)', contrast: 0.93, rAdd: 8, gAdd: 7, bAdd: 9, fade: 10 },
  { id: 'pure_daylight', name: '10. Pure Daylight 5600K', category: 'Studio & Beauty', description: 'Cahaya jendela pagi yang netral dan segar.', previewColor: '#38BDF8', cssFilter: 'brightness(1.07) contrast(1.03)', rMul: 1.05, gMul: 1.06, bMul: 1.07, rAdd: 6, gAdd: 6, bAdd: 8 },
  { id: 'warm_studio', name: '11. Warm Ringlight', category: 'Studio & Beauty', description: 'Cahaya ringlight hangat kekuningan 3200K.', previewColor: '#F59E0B', cssFilter: 'brightness(1.06) sepia(0.14)', rMul: 1.1, gMul: 1.05, bMul: 0.96, rAdd: 8, gAdd: 4 },
  { id: 'velvet_flash', name: '12. Direct Flash Chic', category: 'Studio & Beauty', description: 'Efek lampu blitz kamera saku langsung ke wajah.', previewColor: '#F8FAFC', cssFilter: 'brightness(1.12) contrast(1.14) saturate(1.04)', rMul: 1.1, gMul: 1.1, bMul: 1.1, contrast: 1.15 },
  { id: 'soft_focus', name: '13. Vanilla Cream', category: 'Studio & Beauty', description: 'Krem vanila hangat yang menenangkan.', previewColor: '#FEF08A', cssFilter: 'brightness(1.07) sepia(0.18) contrast(0.95)', sepia: 0.16, rAdd: 10, gAdd: 8, bAdd: 2, contrast: 0.95 },
  { id: 'editorial_clean', name: '14. Vogue Editorial', category: 'Studio & Beauty', description: 'Ketajaman majalah mode dengan warna kulit netral.', previewColor: '#94A3B8', cssFilter: 'contrast(1.1) saturate(0.94) brightness(1.03)', contrast: 1.1, saturation: 0.94, rAdd: 4, gAdd: 4, bAdd: 4 },

  // ==================== 2. ANALOG & KODAK (15 FILTERS) ====================
  { id: 'warm_portra', name: '15. Kodak Portra 400', category: 'Analog & Kodak', description: 'Tone hangat keemasan legendaris untuk potret.', previewColor: '#F59E0B', cssFilter: 'sepia(0.2) contrast(1.08) brightness(1.04) saturate(1.14)', rMul: 1.09, gMul: 1.04, bMul: 0.92, rAdd: 8, gAdd: 4, contrast: 1.06, saturation: 1.12 },
  { id: 'portra_160', name: '16. Kodak Portra 160', category: 'Analog & Kodak', description: 'Saturasi lembut natural dengan highlight pastel.', previewColor: '#FBBF24', cssFilter: 'sepia(0.12) contrast(1.02) brightness(1.05) saturate(0.96)', rMul: 1.06, gMul: 1.03, bMul: 0.97, fade: 10, saturation: 0.96 },
  { id: 'portra_800', name: '17. Kodak Portra 800', category: 'Analog & Kodak', description: 'Kontras kaya dan saturasi amber untuk low-light.', previewColor: '#D97706', cssFilter: 'sepia(0.25) contrast(1.14) saturate(1.22)', rMul: 1.13, gMul: 1.04, bMul: 0.89, contrast: 1.14, saturation: 1.2 },
  { id: 'kodak_gold', name: '18. Kodak Gold 200', category: 'Analog & Kodak', description: 'Kuning keemasan cerah penuh nostalgia liburan.', previewColor: '#EAB308', cssFilter: 'sepia(0.28) saturate(1.25) brightness(1.04)', rMul: 1.14, gMul: 1.08, bMul: 0.88, rAdd: 10, gAdd: 6, saturation: 1.2 },
  { id: 'ultramax_400', name: '19. Ultramax 400', category: 'Analog & Kodak', description: 'Warna primer merah & biru yang kuat dan berani.', previewColor: '#3B82F6', cssFilter: 'contrast(1.12) saturate(1.28)', rMul: 1.08, gMul: 1.02, bMul: 1.1, contrast: 1.12, saturation: 1.28 },
  { id: 'ektar_100', name: '20. Kodak Ektar 100', category: 'Analog & Kodak', description: 'Saturasi ultra-tinggi dan mikro-kontras tajam.', previewColor: '#EF4444', cssFilter: 'contrast(1.18) saturate(1.38)', rMul: 1.12, gMul: 1.02, bMul: 1.05, contrast: 1.18, saturation: 1.36 },
  { id: 'colorplus_200', name: '21. ColorPlus 200', category: 'Analog & Kodak', description: 'Tone kuning-coklat retro tahun 80-an.', previewColor: '#CA8A04', cssFilter: 'sepia(0.32) contrast(1.04) brightness(1.02)', sepia: 0.28, rMul: 1.08, gMul: 1.03, bMul: 0.9, fade: 8 },
  { id: 'proimage_100', name: '22. ProImage 100', category: 'Analog & Kodak', description: 'Akurasi warna kulit tropis yang hangat.', previewColor: '#FB923C', cssFilter: 'sepia(0.14) saturate(1.12) brightness(1.04)', rMul: 1.08, gMul: 1.05, bMul: 0.98, rAdd: 5 },
  { id: 'vision3_500t', name: '23. Vision3 500T Cinema', category: 'Analog & Kodak', description: 'Film bioskop tungsten dengan bayangan biru-hijau.', previewColor: '#0284C7', cssFilter: 'contrast(1.12) hue-rotate(12deg) saturate(1.08)', rMul: 0.95, gMul: 1.04, bMul: 1.14, contrast: 1.12 },
  { id: 'vision3_250d', name: '24. Vision3 250D Daylight', category: 'Analog & Kodak', description: 'Look seluloid film Hollywood siang hari.', previewColor: '#38BDF8', cssFilter: 'contrast(1.08) sepia(0.1) saturate(1.1)', rMul: 1.05, gMul: 1.05, bMul: 1.02, fade: 10, contrast: 1.08 },
  { id: 'kodachrome_64', name: '25. Kodachrome 64', category: 'Analog & Kodak', description: 'Film slide legendaris dengan merah-kuning ikonik.', previewColor: '#DC2626', cssFilter: 'contrast(1.2) sepia(0.2) saturate(1.22)', rMul: 1.15, gMul: 1.03, bMul: 0.9, contrast: 1.2, saturation: 1.18 },
  { id: 'ektachrome_e100', name: '26. Ektachrome E100', category: 'Analog & Kodak', description: 'Film slide dengan nada biru dingin dan putih bersih.', previewColor: '#0EA5E9', cssFilter: 'contrast(1.14) saturate(1.15) hue-rotate(6deg)', rMul: 0.98, gMul: 1.04, bMul: 1.12, contrast: 1.14 },
  { id: 'vintage_1974', name: '27. Vintage 1974', category: 'Analog & Kodak', description: 'Cetakan foto album tahun 1974 yang memudar.', previewColor: '#B45309', cssFilter: 'sepia(0.45) contrast(0.92) brightness(1.04)', sepia: 0.42, fade: 22, contrast: 0.92 },
  { id: 'expired_film', name: '28. Expired Roll 1998', category: 'Analog & Kodak', description: 'Pergeseran warna magenta-hijau khas film kadaluarsa.', previewColor: '#A855F7', cssFilter: 'sepia(0.25) hue-rotate(-18deg) contrast(0.94)', rMul: 1.12, gMul: 0.96, bMul: 1.08, fade: 20 },
  { id: 'warm_negative', name: '29. Amber Halation', category: 'Analog & Kodak', description: 'Efek pendaran cahaya merah-oranye sinematik.', previewColor: '#EA580C', cssFilter: 'sepia(0.3) saturate(1.35) contrast(1.1)', rMul: 1.18, gMul: 1.02, bMul: 0.86, contrast: 1.1 },

  // ==================== 3. FUJI & JAPAN (14 FILTERS) ====================
  { id: 'classic_chrome', name: '30. Fuji Classic Chrome', category: 'Fuji & Japan', description: 'Saturasi rendah dan kontras dokumenter khas Fujifilm.', previewColor: '#0D9488', cssFilter: 'saturate(0.84) contrast(1.14) sepia(0.12)', rMul: 0.98, gMul: 1.03, bMul: 1.02, saturation: 0.84, contrast: 1.14 },
  { id: 'provia_100f', name: '31. Fuji Provia 100F', category: 'Fuji & Japan', description: 'Standar film Jepang dengan keseimbangan warna murni.', previewColor: '#10B981', cssFilter: 'contrast(1.06) saturate(1.1)', rMul: 1.03, gMul: 1.05, bMul: 1.06, contrast: 1.06, saturation: 1.1 },
  { id: 'velvia_50', name: '32. Fuji Velvia 50', category: 'Fuji & Japan', description: 'Warna super pekat dan hijau-biru dramatis.', previewColor: '#059669', cssFilter: 'contrast(1.22) saturate(1.48)', contrast: 1.22, saturation: 1.48 },
  { id: 'astia_100', name: '33. Fuji Astia Soft', category: 'Fuji & Japan', description: 'Mode potret Fujifilm dengan gradasi kulit lembut.', previewColor: '#F472B6', cssFilter: 'brightness(1.05) saturate(1.08) contrast(0.97)', rMul: 1.06, gMul: 1.04, bMul: 1.05, contrast: 0.97 },
  { id: 'superia_400', name: '34. Fuji Superia 400', category: 'Fuji & Japan', description: 'Bayangan hijau zamrud khas rol film Fuji Superia.', previewColor: '#16A34A', cssFilter: 'hue-rotate(10deg) contrast(1.08) saturate(1.12)', rMul: 0.97, gMul: 1.09, bMul: 1.02, contrast: 1.08 },
  { id: 'pro_400h', name: '35. Fuji Pro 400H', category: 'Fuji & Japan', description: 'Pastel cyan-mint terang favorit fotografer pernikahan.', previewColor: '#2DD4BF', cssFilter: 'brightness(1.08) saturate(0.95) hue-rotate(8deg)', rMul: 1.01, gMul: 1.08, bMul: 1.07, rAdd: 8, gAdd: 10, bAdd: 10, saturation: 0.95 },
  { id: 'natura_1600', name: '36. Fuji Natura 1600', category: 'Fuji & Japan', description: 'Atmosfer malam kafe Jepang yang hangat dan lembut.', previewColor: '#D97706', cssFilter: 'sepia(0.22) brightness(1.05) contrast(0.95)', rMul: 1.08, gMul: 1.05, bMul: 0.95, fade: 15 },
  { id: 'kyoto_matcha', name: '37. Kyoto Matcha', category: 'Fuji & Japan', description: 'Tone hijau teh matcha yang menenangkan.', previewColor: '#84CC16', cssFilter: 'sepia(0.18) hue-rotate(38deg) saturate(0.95) brightness(1.04)', rMul: 0.95, gMul: 1.09, bMul: 0.94, gAdd: 10, fade: 10 },
  { id: 'tokyo_neon', name: '38. Shinjuku Neon', category: 'Fuji & Japan', description: 'Lampu malam Tokyo dengan aksen cyan dan magenta.', previewColor: '#E879F9', cssFilter: 'contrast(1.16) saturate(1.3) hue-rotate(-12deg)', rMul: 1.1, gMul: 0.98, bMul: 1.16, contrast: 1.16, saturation: 1.28 },
  { id: 'hokkaido_snow', name: '39. Hokkaido Winter', category: 'Fuji & Japan', description: 'Putih salju dingin dengan langit biru pucat.', previewColor: '#7DD3FC', cssFilter: 'brightness(1.12) saturate(0.85) hue-rotate(12deg)', rMul: 0.98, gMul: 1.06, bMul: 1.14, rAdd: 12, gAdd: 14, bAdd: 18, saturation: 0.85 },
  { id: 'shibuya_dusk', name: '40. Shibuya Sunset', category: 'Fuji & Japan', description: 'Senja ungu-oranye di persimpangan Shibuya.', previewColor: '#FB7185', cssFilter: 'sepia(0.2) hue-rotate(-15deg) saturate(1.25)', rMul: 1.14, gMul: 0.99, bMul: 1.08, saturation: 1.22 },
  { id: 'kamakura_sea', name: '41. Kamakura Breeze', category: 'Fuji & Japan', description: 'Biru laut musim panas anime Jepang yang segar.', previewColor: '#06B6D4', cssFilter: 'brightness(1.07) saturate(1.18) hue-rotate(8deg)', rMul: 0.96, gMul: 1.08, bMul: 1.14, saturation: 1.16 },
  { id: 'showa_retro', name: '42. Showa Era 1982', category: 'Fuji & Japan', description: 'Nuansa majalah Jepang era 80-an.', previewColor: '#F59E0B', cssFilter: 'sepia(0.32) contrast(0.96) saturate(1.08)', sepia: 0.3, fade: 14, rMul: 1.06, gMul: 1.03 },
  { id: 'harajuku_purikura', name: '43. Purikura 2000', category: 'Fuji & Japan', description: 'Cerah merona ala mesin photobooth Purikura.', previewColor: '#F472B6', cssFilter: 'brightness(1.13) saturate(1.22) contrast(1.02)', rMul: 1.12, gMul: 1.07, bMul: 1.1, rAdd: 10, gAdd: 8, bAdd: 10 },

  // ==================== 4. MONOCHROME B&W (14 FILTERS) ====================
  { id: 'bw_classic', name: '44. B&W Classic', category: 'Monochrome B&W', description: 'Hitam putih klasik seimbang sepanjang masa.', previewColor: '#71717A', cssFilter: 'grayscale(1) contrast(1.08)', saturation: 0, contrast: 1.08 },
  { id: 'ilford_hp5', name: '45. Ilford HP5 Plus', category: 'Monochrome B&W', description: 'Hitam putih jurnalistik Inggris dengan midtone kaya.', previewColor: '#52525B', cssFilter: 'grayscale(1) contrast(1.16) brightness(1.02)', saturation: 0, contrast: 1.16, fade: 8 },
  { id: 'trix_400', name: '46. Kodak Tri-X 400', category: 'Monochrome B&W', description: 'Hitam pekat dan highlight tajam khas fotografi jalanan.', previewColor: '#27272A', cssFilter: 'grayscale(1) contrast(1.34)', saturation: 0, contrast: 1.34 },
  { id: 'tmax_100', name: '47. Kodak T-Max 100', category: 'Monochrome B&W', description: 'Gradasi abu-abu super halus untuk potret studio.', previewColor: '#A1A1AA', cssFilter: 'grayscale(1) contrast(1.04) brightness(1.04)', saturation: 0, contrast: 1.04, rAdd: 6, gAdd: 6, bAdd: 6 },
  { id: 'bw_noir', name: '48. Grunge Rock Noir', category: 'Monochrome B&W', description: 'Kontras ekstrem hitam-putih ala sampul album rock.', previewColor: '#18181B', cssFilter: 'grayscale(1) contrast(1.52) brightness(0.95)', saturation: 0, contrast: 1.52 },
  { id: 'silver_halide', name: '49. Silver Gelatin', category: 'Monochrome B&W', description: 'Kilau perak cetakan kamar gelap analog.', previewColor: '#D4D4D8', cssFilter: 'grayscale(1) contrast(1.22) brightness(1.05)', saturation: 0, contrast: 1.22, rMul: 1.04, gMul: 1.04, bMul: 1.06 },
  { id: 'charcoal_matte', name: '50. Charcoal Matte B&W', category: 'Monochrome B&W', description: 'Hitam arang memudar dengan bayangan lembut.', previewColor: '#3F3F46', cssFilter: 'grayscale(1) contrast(0.9) brightness(1.06)', saturation: 0, contrast: 0.92, fade: 28 },
  { id: 'platinum_print', name: '51. Platinum Warm B&W', category: 'Monochrome B&W', description: 'Monokrom dengan sedikit sentuhan hangat platinum.', previewColor: '#A8A29E', cssFilter: 'grayscale(1) sepia(0.14) contrast(1.1)', saturation: 0, sepia: 0.14, contrast: 1.1 },
  { id: 'newspaper_bw', name: '52. Daily Press Koran', category: 'Monochrome B&W', description: 'Hitam putih kertas koran berita dengan kontras cetak.', previewColor: '#78716C', cssFilter: 'grayscale(1) sepia(0.18) contrast(1.28)', saturation: 0, sepia: 0.18, contrast: 1.28, fade: 14 },
  { id: 'wet_plate', name: '53. Wet Plate 1880', category: 'Monochrome B&W', description: 'Fotografi kolodion abad ke-19 yang antik.', previewColor: '#57534E', cssFilter: 'grayscale(1) sepia(0.28) contrast(1.25)', saturation: 0, sepia: 0.28, contrast: 1.25 },
  { id: 'infrared_bw', name: '54. Aerochrome Infrared', category: 'Monochrome B&W', description: 'Kulit terang bercahaya seperti fotografi inframerah.', previewColor: '#E4E4E7', cssFilter: 'grayscale(1) brightness(1.18) contrast(1.28)', saturation: 0, rMul: 1.22, gMul: 1.15, bMul: 1.15, contrast: 1.26 },
  { id: 'graphite_sketch', name: '55. Pencil Graphite', category: 'Monochrome B&W', description: 'Tampilan sketsa pensil grafit terang.', previewColor: '#9CA3AF', cssFilter: 'grayscale(1) brightness(1.15) contrast(1.35)', saturation: 0, contrast: 1.35, rAdd: 18, gAdd: 18, bAdd: 18 },
  { id: 'moonlight_mono', name: '56. Moonlight Selenium', category: 'Monochrome B&W', description: 'Monokrom malam dengan tint biru selenium dingin.', previewColor: '#64748B', cssFilter: 'grayscale(1) sepia(0.15) hue-rotate(180deg) contrast(1.15)', saturation: 0, rMul: 0.94, gMul: 1.0, bMul: 1.12, contrast: 1.15 },
  { id: 'acros_green', name: '57. Fuji Neopan Acros', category: 'Monochrome B&W', description: 'Ketajaman monokrom studio Jepang terbaik.', previewColor: '#4B5563', cssFilter: 'grayscale(1) contrast(1.2)', saturation: 0, contrast: 1.2 },

  // ==================== 5. Y2K & CYBER (14 FILTERS) ====================
  { id: 'y2k_pop', name: '58. Y2K Pop Vivid', category: 'Y2K & Cyber', description: 'Saturasi warna vibrant khas majalah remaja tahun 2000.', previewColor: '#EC4899', cssFilter: 'saturate(1.45) contrast(1.12) brightness(1.03)', saturation: 1.45, contrast: 1.12 },
  { id: 'cyber_2077', name: '59. Cyberpunk 2077', category: 'Y2K & Cyber', description: 'Kontras neon biru-kuning masa depan.', previewColor: '#06B6D4', cssFilter: 'contrast(1.22) saturate(1.35) hue-rotate(15deg)', rMul: 0.96, gMul: 1.08, bMul: 1.22, contrast: 1.2 },
  { id: 'neon_magenta', name: '60. Neon Club Magenta', category: 'Y2K & Cyber', description: 'Pendaran lampu neon pink-ungu klub malam.', previewColor: '#D946EF', cssFilter: 'saturate(1.35) hue-rotate(-25deg) contrast(1.12)', rMul: 1.16, gMul: 0.92, bMul: 1.18, contrast: 1.12, saturation: 1.3 },
  { id: 'electric_cyan', name: '61. Electric Aqua', category: 'Y2K & Cyber', description: 'Aksen biru elektrik segar bergaya futuristik.', previewColor: '#00F5D4', cssFilter: 'saturate(1.25) hue-rotate(22deg) brightness(1.04)', rMul: 0.9, gMul: 1.12, bMul: 1.18, saturation: 1.22 },
  { id: 'vaporwave_95', name: '62. Vaporwave 1995', category: 'Y2K & Cyber', description: 'Estetika pastel ungu-pink retro komputer 90-an.', previewColor: '#C084FC', cssFilter: 'saturate(1.28) hue-rotate(-18deg) brightness(1.06)', rMul: 1.12, gMul: 0.98, bMul: 1.16, fade: 14 },
  { id: 'harajuku_candy', name: '63. Harajuku Candy', category: 'Y2K & Cyber', description: 'Warna permen kapas manis dan cerah.', previewColor: '#F472B6', cssFilter: 'brightness(1.1) saturate(1.35) hue-rotate(-6deg)', rMul: 1.12, gMul: 1.05, bMul: 1.1, saturation: 1.32 },
  { id: 'acid_lime', name: '64. Acid Rave Lime', category: 'Y2K & Cyber', description: 'Tint hijau-kuning asam bergaya poster rave Y2K.', previewColor: '#A3E635', cssFilter: 'hue-rotate(32deg) saturate(1.3) contrast(1.12)', rMul: 1.04, gMul: 1.16, bMul: 0.88, contrast: 1.12 },
  { id: 'bubblegum_pink', name: '65. Bubblegum Pop', category: 'Y2K & Cyber', description: 'Merah muda bubblegum yang fun dan ceria.', previewColor: '#FB7185', cssFilter: 'brightness(1.06) saturate(1.28) hue-rotate(-12deg)', rMul: 1.15, gMul: 1.0, bMul: 1.08, rAdd: 8 },
  { id: 'hologram_blue', name: '66. Metallic Chrome Ice', category: 'Y2K & Cyber', description: 'Kilau dingin metalik perak-biru Y2K.', previewColor: '#93C5FD', cssFilter: 'saturate(0.75) contrast(1.18) brightness(1.06) hue-rotate(15deg)', rMul: 0.96, gMul: 1.04, bMul: 1.14, saturation: 0.78, contrast: 1.18 },
  { id: 'arcade_crt', name: '67. Arcade CRT Monitor', category: 'Y2K & Cyber', description: 'Cahaya fosfor layar mesin game arcade.', previewColor: '#6366F1', cssFilter: 'contrast(1.18) saturate(1.25) hue-rotate(8deg)', rMul: 0.98, gMul: 1.06, bMul: 1.15, contrast: 1.18 },
  { id: 'synthwave_sunset', name: '68. Synthwave 1984', category: 'Y2K & Cyber', description: 'Gradasi matahari terbenam ungu-jingga 80-an.', previewColor: '#F97316', cssFilter: 'sepia(0.2) saturate(1.45) hue-rotate(-14deg)', rMul: 1.18, gMul: 0.98, bMul: 1.1, saturation: 1.4 },
  { id: 'laser_purple', name: '69. Ultraviolet Laser', category: 'Y2K & Cyber', description: 'Sorotan lampu UV ungu elektrik.', previewColor: '#8B5CF6', cssFilter: 'hue-rotate(-30deg) saturate(1.3) contrast(1.1)', rMul: 1.08, gMul: 0.92, bMul: 1.22, contrast: 1.1 },
  { id: 'digicam_2004', name: '70. Cyber-Shot 2004', category: 'Y2K & Cyber', description: 'Karakter CCD kamera digital saku awal 2000-an.', previewColor: '#38BDF8', cssFilter: 'contrast(1.16) saturate(1.18) brightness(1.04)', rMul: 1.04, gMul: 1.06, bMul: 1.08, contrast: 1.16, saturation: 1.18 },
  { id: 'denim_indigo', name: '71. Raw Denim Indigo', category: 'Y2K & Cyber', description: 'Tone biru jeans indigo dengan kontras street style.', previewColor: '#1D4ED8', cssFilter: 'contrast(1.12) saturate(0.92) hue-rotate(10deg)', rMul: 0.94, gMul: 1.01, bMul: 1.14, contrast: 1.12, saturation: 0.92 },

  // ==================== 6. CINEMATIC MOOD (14 FILTERS) ====================
  { id: 'teal_orange', name: '72. Hollywood Teal & Orange', category: 'Cinematic Mood', description: 'Color grading blockbuster dengan kulit hangat & shadow teal.', previewColor: '#0EA5E9', cssFilter: 'contrast(1.14) saturate(1.22) sepia(0.12)', rMul: 1.1, gMul: 1.02, bMul: 1.08, contrast: 1.14, saturation: 1.2 },
  { id: 'cool_cyber', name: '73. Cine 800T Night', category: 'Cinematic Mood', description: 'Nuansa malam sinematik biru-cyan dingin.', previewColor: '#06B6D4', cssFilter: 'contrast(1.12) saturate(0.92) hue-rotate(15deg)', rMul: 0.9, gMul: 1.03, bMul: 1.16, contrast: 1.12 },
  { id: 'wong_kar_wai', name: '74. Chungking Express', category: 'Cinematic Mood', description: 'Hijau-kuning neon sinema Hong Kong tahun 90-an.', previewColor: '#10B981', cssFilter: 'sepia(0.28) hue-rotate(25deg) contrast(1.18) saturate(1.2)', rMul: 1.04, gMul: 1.14, bMul: 0.88, contrast: 1.18 },
  { id: 'wes_anderson', name: '75. Grand Budapest Pastel', category: 'Cinematic Mood', description: 'Palet kuning-pink simetris penuh kehangatan.', previewColor: '#F43F5E', cssFilter: 'sepia(0.2) saturate(1.25) brightness(1.06)', rMul: 1.12, gMul: 1.06, bMul: 0.96, rAdd: 8, gAdd: 6 },
  { id: 'euphoria_gold', name: '76. Euphoria Midnight', category: 'Cinematic Mood', description: 'Gemilang ungu-emas dramatis penuh emosi.', previewColor: '#A855F7', cssFilter: 'contrast(1.16) saturate(1.28) hue-rotate(-10deg)', rMul: 1.12, gMul: 0.98, bMul: 1.14, contrast: 1.16 },
  { id: 'nordic_cold', name: '77. Scandinavian Frost', category: 'Cinematic Mood', description: 'Desaturasi dingin minimalis ala sinema Nordik.', previewColor: '#64748B', cssFilter: 'saturate(0.72) contrast(1.08) brightness(1.04)', saturation: 0.72, rMul: 0.96, gMul: 1.02, bMul: 1.08, contrast: 1.08 },
  { id: 'desert_dune', name: '78. Arrakis Spice', category: 'Cinematic Mood', description: 'Tone pasir gurun keemasan yang epik.', previewColor: '#D97706', cssFilter: 'sepia(0.38) contrast(1.12) saturate(1.15)', sepia: 0.35, rMul: 1.12, gMul: 1.04, bMul: 0.86, contrast: 1.12 },
  { id: 'midnight_rain', name: '79. Rainy Neon Asphalt', category: 'Cinematic Mood', description: 'Bayangan biru pekat dengan pantulan cahaya basah.', previewColor: '#1E40AF', cssFilter: 'contrast(1.18) brightness(0.97) hue-rotate(12deg)', rMul: 0.92, gMul: 1.0, bMul: 1.14, contrast: 1.18 },
  { id: 'golden_hour', name: '80. Sunset Golden Hour', category: 'Cinematic Mood', description: 'Cahaya matahari sore keemasan yang romantis.', previewColor: '#EA580C', cssFilter: 'sepia(0.32) saturate(1.38) contrast(1.08)', rMul: 1.18, gMul: 1.05, bMul: 0.84, contrast: 1.08 },
  { id: 'blue_hour', name: '81. Twilight Blue Hour', category: 'Cinematic Mood', description: 'Momen senja biru tenang sesaat setelah matahari terbenam.', previewColor: '#2563EB', cssFilter: 'hue-rotate(18deg) saturate(1.12) brightness(0.98)', rMul: 0.9, gMul: 1.02, bMul: 1.18 },
  { id: 'autumn_amber', name: '82. Autumn Foliage', category: 'Cinematic Mood', description: 'Nuansa daun musim gugur coklat-kemerahan.', previewColor: '#B45309', cssFilter: 'sepia(0.28) saturate(1.25) hue-rotate(-8deg)', rMul: 1.14, gMul: 1.02, bMul: 0.88, saturation: 1.2 },
  { id: 'emerald_forest', name: '83. Pine Forest', category: 'Cinematic Mood', description: 'Hijau hutan pinus yang dalam dan misterius.', previewColor: '#047857', cssFilter: 'hue-rotate(25deg) saturate(0.92) contrast(1.12)', rMul: 0.92, gMul: 1.08, bMul: 0.96, contrast: 1.12 },
  { id: 'vintage_cinema', name: '84. Technicolor 1955', category: 'Cinematic Mood', description: 'Warna Technicolor 3-strip klasik yang megah.', previewColor: '#DC2626', cssFilter: 'saturate(1.35) contrast(1.16) sepia(0.12)', rMul: 1.12, gMul: 1.04, bMul: 1.06, saturation: 1.32, contrast: 1.16 },
  { id: 'amelie_paris', name: '85. Paris Montmartre', category: 'Cinematic Mood', description: 'Kombinasi hijau hangat dan merah tua sinema Prancis.', previewColor: '#15803D', cssFilter: 'sepia(0.24) hue-rotate(15deg) saturate(1.25) contrast(1.12)', rMul: 1.08, gMul: 1.12, bMul: 0.86, contrast: 1.12 },

  // ==================== 7. RETRO & LOMO (12 FILTERS) ====================
  { id: 'sepia_retro', name: '86. Classic Sepia 70s', category: 'Retro & Lomo', description: 'Klasik kecoklatan vintage seperti album foto lama.', previewColor: '#A16207', cssFilter: 'sepia(0.78) contrast(0.96) brightness(1.03)', sepia: 0.78, contrast: 0.96 },
  { id: 'lomo_contrast', name: '87. Lomo LC-A Punch', category: 'Retro & Lomo', description: 'Kontras tajam dan warna pekat ala kamera Lomo.', previewColor: '#DC2626', cssFilter: 'contrast(1.3) saturate(1.35) brightness(0.97)', contrast: 1.3, saturation: 1.35 },
  { id: 'polaroid_sx70', name: '88. Polaroid SX-70', category: 'Retro & Lomo', description: 'Karakter foto instan Polaroid dengan krem hangat.', previewColor: '#F59E0B', cssFilter: 'sepia(0.22) contrast(0.95) brightness(1.06)', sepia: 0.22, fade: 18, rAdd: 8, gAdd: 6 },
  { id: 'instax_mini', name: '89. Instax Mini Gloss', category: 'Retro & Lomo', description: 'Highlight cerah dan warna kulit pastel foto instan.', previewColor: '#38BDF8', cssFilter: 'brightness(1.1) contrast(1.05) saturate(1.08)', rMul: 1.06, gMul: 1.07, bMul: 1.09, rAdd: 8, gAdd: 8, bAdd: 10 },
  { id: 'matte_fade', name: '90. Faded Postcard', category: 'Retro & Lomo', description: 'Shadow pudar keabu-abuan seperti kartu pos antik.', previewColor: '#64748B', cssFilter: 'contrast(0.85) brightness(1.08) saturate(0.85)', contrast: 0.86, saturation: 0.85, fade: 28 },
  { id: 'coffee_stain', name: '91. Espresso Roast', category: 'Retro & Lomo', description: 'Tone coklat kopi hangat dan pekat.', previewColor: '#78350F', cssFilter: 'sepia(0.55) contrast(1.12) brightness(0.96)', sepia: 0.55, contrast: 1.12, rMul: 1.06 },
  { id: 'sunburn_leak', name: '92. Summer Light Leak', category: 'Retro & Lomo', description: 'Pendaran cahaya matahari merah-kuning di tepi film.', previewColor: '#F97316', cssFilter: 'sepia(0.25) saturate(1.3) brightness(1.06)', rMul: 1.16, gMul: 1.05, bMul: 0.9, rAdd: 10 },
  { id: 'bronze_age', name: '93. Bronze Metallic', category: 'Retro & Lomo', description: 'Warna perunggu metalik yang hangat dan elegan.', previewColor: '#B45309', cssFilter: 'sepia(0.45) contrast(1.15) saturate(0.9)', sepia: 0.45, contrast: 1.15, saturation: 0.9 },
  { id: 'copper_tone', name: '94. Copper Penny', category: 'Retro & Lomo', description: 'Sentuhan tembaga kemerahan yang klasik.', previewColor: '#C2410C', cssFilter: 'sepia(0.4) hue-rotate(-10deg) contrast(1.1)', sepia: 0.38, rMul: 1.12, gMul: 0.98, contrast: 1.1 },
  { id: 'caramel_warm', name: '95. Salted Caramel', category: 'Retro & Lomo', description: 'Karamel manis dengan bayangan coklat lembut.', previewColor: '#D97706', cssFilter: 'sepia(0.3) brightness(1.05) saturate(1.15)', sepia: 0.28, rMul: 1.1, gMul: 1.04, fade: 10 },
  { id: 'dusty_attic', name: '96. Dusty Vinyl 1969', category: 'Retro & Lomo', description: 'Sampul piringan hitam tua tahun 1969.', previewColor: '#A8A29E', cssFilter: 'sepia(0.35) saturate(0.75) contrast(0.92)', sepia: 0.35, saturation: 0.75, fade: 22 },
  { id: 'vintage_90s', name: '97. 90s Disposable Cam', category: 'Retro & Lomo', description: 'Kamera sekali pakai tahun 90-an dengan flash hijau.', previewColor: '#10B981', cssFilter: 'sepia(0.18) contrast(1.1) hue-rotate(12deg)', rMul: 0.98, gMul: 1.08, bMul: 0.94, gAdd: 10, fade: 10 },

  // ==================== 8. EXPERIMENTAL FX (11 FILTERS) ====================
  { id: 'dreamy_glow', name: '98. Angel Diffusion', category: 'Experimental FX', description: 'Cahaya lembut berkilau seperti mimpi.', previewColor: '#C084FC', cssFilter: 'brightness(1.1) contrast(1.02) saturate(1.12)', rMul: 1.08, gMul: 1.06, bMul: 1.1, rAdd: 10, gAdd: 8, bAdd: 12 },
  { id: 'negative_invert', name: '99. X-Ray Negative', category: 'Experimental FX', description: 'Inversi warna negatif film eksperimental.', previewColor: '#38BDF8', cssFilter: 'invert(1) hue-rotate(180deg)', invert: true },
  { id: 'duotone_cyber', name: '100. Duotone Pink/Navy', category: 'Experimental FX', description: 'Pemetaan dua warna biru malam dan neon pink.', previewColor: '#EC4899', cssFilter: 'contrast(1.25) hue-rotate(-25deg) saturate(1.5)', duotone: [18, 22, 64, 244, 114, 182] },
  { id: 'duotone_gold', name: '101. Duotone Obsidian/Gold', category: 'Experimental FX', description: 'Kemewahan hitam legam dan emas berkilau.', previewColor: '#EAB308', cssFilter: 'sepia(0.9) contrast(1.3)', duotone: [15, 15, 18, 250, 204, 21] },
  { id: 'duotone_matrix', name: '102. Matrix Terminal', category: 'Experimental FX', description: 'Hijau kode matriks digital di atas hitam.', previewColor: '#22C55E', cssFilter: 'sepia(0.8) hue-rotate(70deg) contrast(1.3)', duotone: [8, 24, 12, 74, 222, 128] },
  { id: 'duotone_crimson', name: '103. Redroom Darkroom', category: 'Experimental FX', description: 'Lampu merah kamar gelap pencucian foto analog.', previewColor: '#EF4444', cssFilter: 'sepia(0.9) hue-rotate(-45deg) contrast(1.25)', duotone: [20, 6, 8, 248, 113, 113] },
  { id: 'duotone_ocean', name: '104. Cyanotype Blueprint', category: 'Experimental FX', description: 'Cetakan biru Prusia cyanotype klasik abad ke-19.', previewColor: '#0284C7', cssFilter: 'sepia(0.9) hue-rotate(165deg) contrast(1.2)', duotone: [12, 34, 68, 186, 230, 253] },
  { id: 'thermal_vision', name: '105. Thermal Heatwave', category: 'Experimental FX', description: 'Palet kamera termal ungu-oranye menyala.', previewColor: '#F97316', cssFilter: 'contrast(1.35) saturate(1.6) hue-rotate(-30deg)', duotone: [48, 16, 108, 251, 146, 60] },
  { id: 'ultraviolet_fx', name: '106. Blacklight UV', category: 'Experimental FX', description: 'Fluoresensi ungu neon di ruangan gelap.', previewColor: '#A855F7', cssFilter: 'contrast(1.25) hue-rotate(-40deg) saturate(1.4)', duotone: [16, 10, 45, 192, 132, 252] },
  { id: 'frosted_mist', name: '107. Frosted Glass Mist', category: 'Experimental FX', description: 'Kabut kaca es terang yang lembut dan estetik.', previewColor: '#CBD5E1', cssFilter: 'brightness(1.12) contrast(0.84) saturate(0.85)', contrast: 0.84, saturation: 0.85, fade: 34 },
  { id: 'high_key_pop', name: '108. High-Key Magazine', category: 'Experimental FX', description: 'Eksposur terang benderang dengan kontras pop.', previewColor: '#F43F5E', cssFilter: 'brightness(1.14) contrast(1.18) saturate(1.2)', rMul: 1.12, gMul: 1.12, bMul: 1.12, contrast: 1.18, saturation: 1.2 },
]

export const PHOTO_FILTERS: PhotoFilter[] = FILTER_SPECS.map((spec) => ({
  id: spec.id,
  name: spec.name,
  category: spec.category,
  description: spec.description,
  cssFilter: spec.cssFilter,
  previewColor: spec.previewColor,
  canvasProcess: createGradeProcessor(spec),
}))

export const DEFAULT_FILTER = PHOTO_FILTERS[0]
