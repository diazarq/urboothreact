import React, { useState, useRef } from 'react'
import {
  Plus,
  Camera,
  Palette,
  Check,
  Upload,
  Image as ImageIcon,
  Sliders,
  Trash2,
} from 'lucide-react'
import type { CustomSlotRect, FrameIllustration, FrameTemplate } from '../types'
import { FrameCardPreview } from './FrameCardPreview'
import { sound } from '../utils/sound'

interface MyFramesViewProps {
  customFrames: FrameTemplate[]
  onCreateCustomFrame: (newFrame: FrameTemplate) => void
  onStartWithFrame: (frame: FrameTemplate) => void
  isDark: boolean
}

function generateSlotRects(
  slots: 1 | 3 | 4 | 6,
  cols: 1 | 2,
  marginX: number,
  marginTop: number,
  marginBottom: number,
  gap: number,
  radius: number
): CustomSlotRect[] {
  const rows = Math.ceil(slots / cols)
  const availW = 1 - marginX * 2 - gap * (cols - 1)
  const availH = 1 - marginTop - marginBottom - gap * (rows - 1)
  const slotW = availW / cols
  const slotH = availH / rows

  const rects: CustomSlotRect[] = []
  for (let i = 0; i < slots; i++) {
    const c = i % cols
    const r = Math.floor(i / cols)
    rects.push({
      x: marginX + c * (slotW + gap),
      y: marginTop + r * (slotH + gap),
      w: slotW,
      h: slotH,
      radius,
    })
  }
  return rects
}

export const MyFramesView: React.FC<MyFramesViewProps> = ({
  customFrames,
  onCreateCustomFrame,
  onStartWithFrame,
  isDark,
}) => {
  const [creatorTab, setCreatorTab] = useState<'upload' | 'design'>('upload')

  // ==================== TAB 1: UPLOAD USER FRAME STATE ====================
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadName, setUploadName] = useState('')
  const [uploadTag, setUploadTag] = useState('FRAME KUSTOM')
  const [uploadImageUrl, setUploadImageUrl] = useState<string>('')
  const [uploadMode, setUploadMode] = useState<'overlay_png' | 'template_bg'>('overlay_png')
  const [uploadLayout, setUploadLayout] = useState<'1x3' | '1x4' | '2x2' | '2x3' | '4r'>('1x4')
  const [slotMarginX, setSlotMarginX] = useState(0.08)
  const [slotMarginTop, setSlotMarginTop] = useState(0.08)
  const [slotMarginBottom, setSlotMarginBottom] = useState(0.16)
  const [slotGap, setSlotGap] = useState(0.025)
  const [slotRadius, setSlotRadius] = useState(8)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // ==================== TAB 2: DESIGN GENERATOR STATE ====================
  const [name, setName] = useState('Edisi Denim & Koran Saya')
  const [venue, setVenue] = useState('EDISI SPESIAL URBOOTH')
  const [bgColor, setBgColor] = useState('#1E3A5F')
  const [textColor, setTextColor] = useState('#FEF3C7')
  const [slots, setSlots] = useState<3 | 4 | 6>(4)
  const [slotShape, setSlotShape] = useState<'rect' | 'rounded' | 'oval'>('rect')
  const [illustration, setIllustration] = useState<FrameIllustration>('denim_jeans')
  const [createdSuccess, setCreatedSuccess] = useState(false)

  const layoutConfigMap = {
    '1x3': { slots: 3 as const, cols: 1 as const, rows: 3, category: 'strip_1x3' as const, label: '1x3 Strip', ratio: 4 / 3 },
    '1x4': { slots: 4 as const, cols: 1 as const, rows: 4, category: 'strip_1x4' as const, label: '1x4 Strip', ratio: 4 / 3 },
    '2x2': { slots: 4 as const, cols: 2 as const, rows: 2, category: 'grid_2x2' as const, label: '2x2 Grid', ratio: 1 },
    '2x3': { slots: 6 as const, cols: 2 as const, rows: 3, category: 'grid_2x3' as const, label: '2x3 Double Strip (6 Foto)', ratio: 4 / 3 },
    '4r': { slots: 1 as const, cols: 1 as const, rows: 1, category: 'single_4r' as const, label: 'Single 4R', ratio: 3 / 4 },
  }

  const activeUploadCfg = layoutConfigMap[uploadLayout]
  const calculatedSlots = generateSlotRects(
    activeUploadCfg.slots,
    activeUploadCfg.cols,
    slotMarginX,
    slotMarginTop,
    slotMarginBottom,
    slotGap,
    slotRadius
  )

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadImageUrl(reader.result)
        if (!uploadName.trim()) {
          setUploadName(file.name.replace(/\.[^/.]+$/, ''))
        }
        // Auto-detect PNG vs JPG
        if (file.type === 'image/png') {
          setUploadMode('overlay_png')
        } else {
          setUploadMode('template_bg')
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveUploadedFrame = (e: React.FormEvent, startImmediately = false) => {
    e.preventDefault()
    if (!uploadImageUrl || !uploadName.trim()) return
    sound.playShutter()

    const newFrame: FrameTemplate = {
      id: `user_upload_${Date.now()}`,
      name: uploadName.trim(),
      code: `UPL-${Math.floor(100 + Math.random() * 899)}`,
      category: activeUploadCfg.category,
      layoutLabel: activeUploadCfg.label,
      themeType: 'custom',
      illustration: 'none',
      slots: activeUploadCfg.slots,
      cols: activeUploadCfg.cols,
      rows: activeUploadCfg.rows,
      aspectRatio: activeUploadCfg.ratio,
      aspectRatioLabel: activeUploadCfg.ratio === 1 ? '1:1' : '4:3',
      dimensionsLabel: '2400 × 3600px',
      usageCount: 1,
      creatorName: 'Kreator Urbooth',
      isLocked: false,
      isActive: true,
      isNew: true,
      isCustomUserFrame: true,
      expiresAt: '2027-12-31',
      // If transparent PNG overlay: draws photos behind PNG. If full JPG/PNG template: draws photos inside calculatedSlots!
      customOverlayUrl: uploadMode === 'overlay_png' ? uploadImageUrl : undefined,
      imageTemplateUrl: uploadMode === 'template_bg' ? uploadImageUrl : undefined,
      customSlots: uploadMode === 'template_bg' ? calculatedSlots : undefined,
      slotShape: slotRadius > 0 ? 'rounded' : 'rect',
      bgColor: '#18181B',
      textColor: '#FFFFFF',
      accentColor: '#FFB020',
      subtleBorderColor: '#3F3F46',
      tag: uploadTag || 'FRAME KUSTOM',
      badgeText: 'KUSTOM',
      description: 'Frame kustom yang diunggah langsung dari perangkat.',
      defaultVenue: uploadName.trim().toUpperCase(),
    }

    onCreateCustomFrame(newFrame)
    setUploadSuccess(true)
    setTimeout(() => setUploadSuccess(false), 2500)

    if (startImmediately) {
      onStartWithFrame(newFrame)
    }
  }

  const previewTemplate: FrameTemplate = {
    id: `preview_custom_${bgColor}_${slots}_${slotShape}_${illustration}`,
    name: name || 'Custom Frame',
    code: 'CUSTOM',
    category: slots === 6 ? 'grid_2x3' : slots === 4 ? 'strip_1x4' : 'strip_1x3',
    layoutLabel: slots === 6 ? '4R (Double Strip 6 Cut)' : `1x${slots} Strip`,
    themeType: 'custom',
    illustration,
    slots,
    cols: slots === 6 ? 2 : 1,
    rows: slots === 6 ? 3 : slots,
    slotShape,
    aspectRatio: 4 / 3,
    aspectRatioLabel: '4:3',
    dimensionsLabel: slots === 6 ? '2400 × 3600px' : '1200 × 3600px',
    usageCount: 1,
    creatorName: 'Kreator Urbooth',
    isLocked: false,
    isActive: true,
    isCustomUserFrame: true,
    bgColor,
    textColor,
    accentColor: '#FFB020',
    subtleBorderColor: textColor,
    tag: 'MY CUSTOM FRAME',
    description: 'Frame kustom yang dibuat di Urbooth Glass Creator Studio.',
    defaultVenue: venue || 'URBOOTH CUSTOM',
  }

  const handleSaveGeneratedFrame = (e: React.FormEvent) => {
    e.preventDefault()
    sound.playShutter()
    const newFrame: FrameTemplate = {
      ...previewTemplate,
      id: `user_frame_${Date.now()}`,
      code: `MY-${Math.floor(10 + Math.random() * 89)}`,
    }
    onCreateCustomFrame(newFrame)
    setCreatedSuccess(true)
    setTimeout(() => setCreatedSuccess(false), 2500)
  }

  const colorPresets = [
    { label: 'Indigo Jeans', bg: '#1E3A5F', text: '#FEF3C7' },
    { label: 'Newsprint Koran', bg: '#EAE4D7', text: '#18181B' },
    { label: 'Blossom Pink', bg: '#FFF0F5', text: '#83284F' },
    { label: 'Retro Orange', bg: '#F6A85E', text: '#FFFFFF' },
    { label: 'Stage Black', bg: '#141417', text: '#FFFFFF' },
    { label: 'Maroon Ticket', bg: '#7F1D1D', text: '#FFFFFF' },
    { label: 'Arcade Blue', bg: '#3B6EE2', text: '#FFFFFF' },
    { label: 'Clean White', bg: '#FFFFFF', text: '#18181B' },
  ]

  return (
    <div className="w-full space-y-10 pb-12">
      {/* ==================== TOP SECTION: UPLOAD FRAME / CREATOR STUDIO ==================== */}
      <section
        className={`rounded-3xl p-6 sm:p-8 ${
          isDark ? 'glass-panel-dark' : 'glass-panel-light'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-white/10">
          <div>
            <span className="text-xs font-semibold text-[#FFB020] font-bold uppercase tracking-wider">
              STUDIO KREATOR FRAME
            </span>
            <h1 className="text-2xl font-extrabold mt-0.5">
              Unggah Frame Sendiri atau Desain Baru
            </h1>
          </div>

          {/* 2-Tab Switcher */}
          <div
            className={`flex p-1 rounded-2xl border ${
              isDark ? 'bg-slate-950/60 border-white/10' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <button
              onClick={() => {
                sound.playClick()
                setCreatorTab('upload')
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                creatorTab === 'upload'
                  ? 'bg-[#FFB020] text-[#0F0F14] shadow'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Frame (PNG / JPG)</span>
            </button>
            <button
              onClick={() => {
                sound.playClick()
                setCreatorTab('design')
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                creatorTab === 'design'
                  ? 'bg-[#FFB020] text-[#0F0F14] shadow'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Desain Template</span>
            </button>
          </div>
        </div>

        {/* -------------------- TAB 1: UPLOAD FRAME PNG / JPG -------------------- */}
        {creatorTab === 'upload' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 5 Cols: Interactive Dropzone & Live Slot Preview */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleUploadFile}
                className="hidden"
              />

              {!uploadImageUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full min-h-[420px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all hover:border-[#FFB020] ${
                    isDark
                      ? 'bg-slate-950/50 border-white/20'
                      : 'bg-slate-100/80 border-slate-300'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#FFB020]/15 text-[#FFB020] flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-base">
                    Klik untuk Upload File Frame Kamu
                  </h3>
                  <p className="text-xs opacity-65 mt-1.5 max-w-xs leading-relaxed">
                    Mendukung <strong>PNG Transparan</strong> (overlay Canva / Photoshop) maupun{' '}
                    <strong>JPG / PNG Template</strong> biasa.
                  </p>
                  <span className="mt-5 px-5 py-2.5 rounded-xl bg-[#FFB020] text-[#0F0F14] text-xs font-bold shadow">
                    Pilih File Gambar
                  </span>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <div
                    className={`relative w-full rounded-2xl p-4 flex items-center justify-center overflow-hidden ${
                      isDark ? 'bg-slate-950/70 border border-white/10' : 'bg-slate-200/70'
                    }`}
                  >
                    {/* Live Uploaded Frame Image + Slot Position Guides */}
                    <div className="relative inline-block max-h-[460px]">
                      <img
                        src={uploadImageUrl}
                        alt="Uploaded Frame Preview"
                        className="max-h-[440px] w-auto object-contain rounded shadow-xl block"
                      />

                      {/* Live Numbered Slot Guides Overlay */}
                      {uploadMode === 'template_bg' &&
                        calculatedSlots.map((slot, idx) => (
                          <div
                            key={idx}
                            style={{
                              left: `${slot.x * 100}%`,
                              top: `${slot.y * 100}%`,
                              width: `${slot.w * 100}%`,
                              height: `${slot.h * 100}%`,
                              borderRadius: `${slot.radius || 0}px`,
                            }}
                            className="absolute border-2 border-dashed border-[#FFB020] bg-[#FFB020]/20 flex items-center justify-center pointer-events-none"
                          >
                            <span className="px-2 py-0.5 rounded bg-black/70 text-white font-extrabold font-black text-sm">
                              {idx + 1}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-[#FFB020] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Ganti Gambar Frame</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadImageUrl('')}
                      className="text-xs font-bold text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right 7 Cols: Upload Frame Settings & Publish */}
            <form
              onSubmit={(e) => handleSaveUploadedFrame(e, false)}
              className="lg:col-span-7 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">
                    Nama Frame Kamu *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="misal: Frame Ultah Bestie 2026"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-[#FFB020] ${
                      isDark
                        ? 'bg-white/5 border-white/15 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">
                    Kategori / Label Tag
                  </label>
                  <input
                    type="text"
                    value={uploadTag}
                    onChange={(e) => setUploadTag(e.target.value)}
                    placeholder="USER FRAME / EVENT / BAND"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-[#FFB020] ${
                      isDark
                        ? 'bg-white/5 border-white/15 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Frame Type Selector: PNG Overlay vs JPG Template */}
              <div>
                <label className="block text-xs font-bold mb-2 opacity-80">
                  Jenis File Frame yang Diupload:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick()
                      setUploadMode('overlay_png')
                    }}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      uploadMode === 'overlay_png'
                        ? 'bg-[#FFB020]/15 border-[#FFB020] ring-1 ring-[#FFB020]'
                        : isDark
                        ? 'glass-card-dark'
                        : 'glass-card-light'
                    }`}
                  >
                    <div className="font-bold text-xs">PNG Overlay Transparan</div>
                    <p className="text-[10px] opacity-65 mt-0.5">
                      Bagian foto berlubang transparan (dari Canva/Photoshop). Foto diletakkan di
                      belakang bingkai PNG.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick()
                      setUploadMode('template_bg')
                    }}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      uploadMode === 'template_bg'
                        ? 'bg-[#FFB020]/15 border-[#FFB020] ring-1 ring-[#FFB020]'
                        : isDark
                        ? 'glass-card-dark'
                        : 'glass-card-light'
                    }`}
                  >
                    <div className="font-bold text-xs">Template Gambar Penuh (JPG/PNG)</div>
                    <p className="text-[10px] opacity-65 mt-0.5">
                      Gambar utuh tanpa lubang transparan. Foto otomatis masuk ke kotak slot 1–6
                      yang bisa diatur posisinya.
                    </p>
                  </button>
                </div>
              </div>

              {/* Layout Slot Picker */}
              <div>
                <label className="block text-xs font-bold mb-2 opacity-80">
                  Pilih Layout Jumlah Foto:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(
                    [
                      { id: '1x3', label: '1x3 (3 Foto)' },
                      { id: '1x4', label: '1x4 (4 Foto)' },
                      { id: '2x2', label: '2x2 (4 Foto)' },
                      { id: '2x3', label: '2x3 (6 Foto)' },
                      { id: '4r', label: '4R (1 Foto)' },
                    ] as const
                  ).map((ly) => (
                    <button
                      type="button"
                      key={ly.id}
                      onClick={() => {
                        sound.playClick()
                        setUploadLayout(ly.id)
                      }}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                        uploadLayout === ly.id
                          ? 'bg-[#FFB020] text-[#0F0F14] border-[#FFB020]'
                          : isDark
                          ? 'glass-card-dark text-slate-300'
                          : 'glass-card-light text-slate-700'
                      }`}
                    >
                      {ly.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slot Position Sliders (visible for Template JPG/PNG mode) */}
              {uploadMode === 'template_bg' && (
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#FFB020]">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Atur Posisi Kotak Slot Foto (1–{activeUploadCfg.slots})</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <label className="space-y-1">
                      <span className="opacity-75">Margin Kiri/Kanan: {Math.round(slotMarginX * 100)}%</span>
                      <input
                        type="range"
                        min={0.02}
                        max={0.25}
                        step={0.01}
                        value={slotMarginX}
                        onChange={(e) => setSlotMarginX(Number(e.target.value))}
                        className="w-full accent-[#FFB020]"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="opacity-75">Margin Atas: {Math.round(slotMarginTop * 100)}%</span>
                      <input
                        type="range"
                        min={0.02}
                        max={0.3}
                        step={0.01}
                        value={slotMarginTop}
                        onChange={(e) => setSlotMarginTop(Number(e.target.value))}
                        className="w-full accent-[#FFB020]"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="opacity-75">Margin Bawah: {Math.round(slotMarginBottom * 100)}%</span>
                      <input
                        type="range"
                        min={0.04}
                        max={0.35}
                        step={0.01}
                        value={slotMarginBottom}
                        onChange={(e) => setSlotMarginBottom(Number(e.target.value))}
                        className="w-full accent-[#FFB020]"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="opacity-75">Jarak & Sudut: {slotRadius}px</span>
                      <div className="flex gap-2">
                        <input
                          type="range"
                          min={0.01}
                          max={0.08}
                          step={0.005}
                          value={slotGap}
                          onChange={(e) => setSlotGap(Number(e.target.value))}
                          className="w-1/2 accent-[#FFB020]"
                        />
                        <input
                          type="range"
                          min={0}
                          max={24}
                          step={2}
                          value={slotRadius}
                          onChange={(e) => setSlotRadius(Number(e.target.value))}
                          className="w-1/2 accent-[#FFB020]"
                        />
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!uploadImageUrl || !uploadName.trim()}
                  className={`py-3.5 rounded-2xl border font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    uploadImageUrl && uploadName.trim()
                      ? isDark
                        ? 'glass-card-dark hover:bg-white/10 text-white cursor-pointer'
                        : 'glass-card-light hover:bg-white text-slate-900 cursor-pointer'
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  {uploadSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Tersimpan di Frame Kita!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Simpan ke Frame Kita</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={!uploadImageUrl || !uploadName.trim()}
                  onClick={(e) => handleSaveUploadedFrame(e, true)}
                  className={`py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    uploadImageUrl && uploadName.trim()
                      ? 'bg-[#FFB020] text-[#0F0F14] text-white shadow-lg  cursor-pointer'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Simpan & Langsung Foto</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* -------------------- TAB 2: DESIGN TEMPLATE GENERATOR -------------------- */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div
              className={`lg:col-span-5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[420px] ${
                isDark ? 'bg-slate-950/60' : 'bg-slate-200/60'
              }`}
            >
              <FrameCardPreview frame={previewTemplate} className="max-h-[380px] w-auto shadow-2xl" />
            </div>

            <form onSubmit={handleSaveGeneratedFrame} className="lg:col-span-7 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">Nama Frame</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-[#FFB020] ${
                      isDark
                        ? 'bg-white/5 border-white/15 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">
                    Teks Judul / Headline
                  </label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-[#FFB020] ${
                      isDark
                        ? 'bg-white/5 border-white/15 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 opacity-80">
                  Pilih Palet Warna Frame
                </label>
                <div className="flex items-center flex-wrap gap-2">
                  {colorPresets.map((p) => (
                    <button
                      type="button"
                      key={p.label}
                      onClick={() => {
                        sound.playClick()
                        setBgColor(p.bg)
                        setTextColor(p.text)
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                        bgColor === p.bg
                          ? 'border-[#FFB020] ring-2 ring-[#FFB020]/30'
                          : isDark
                          ? 'glass-card-dark text-slate-300'
                          : 'glass-card-light text-slate-700'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: p.bg }}
                      />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-2 opacity-80">
                    Jumlah Slot Foto
                  </label>
                  <div className="flex gap-2">
                    {([3, 4, 6] as const).map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => {
                          sound.playClick()
                          setSlots(s)
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                          slots === s
                            ? 'bg-[#FFB020] text-[#0F0F14] border-[#FFB020]'
                            : isDark
                            ? 'glass-card-dark text-slate-300'
                            : 'glass-card-light text-slate-700'
                        }`}
                      >
                        {s === 6 ? '6 Foto (2x3)' : `${s} Foto (1x${s})`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2 opacity-80">
                    Bentuk Potongan Foto
                  </label>
                  <div className="flex gap-2">
                    {(
                      [
                        { id: 'rect', label: 'Kotak' },
                        { id: 'rounded', label: 'Rounded' },
                        { id: 'oval', label: 'Oval' },
                      ] as const
                    ).map((sh) => (
                      <button
                        type="button"
                        key={sh.id}
                        onClick={() => {
                          sound.playClick()
                          setSlotShape(sh.id)
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                          slotShape === sh.id
                            ? 'bg-[#FFB020] text-[#0F0F14] border-[#FFB020]'
                            : isDark
                            ? 'glass-card-dark text-slate-300'
                            : 'glass-card-light text-slate-700'
                        }`}
                      >
                        {sh.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 opacity-80">Tema Tekstur Frame</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'denim_jeans', label: 'Denim Jeans 501' },
                      { id: 'newspaper_press', label: 'Daily Koran Press' },
                      { id: 'meme_white_grid', label: 'Viral Meme Grid' },
                      { id: 'ios_music_player', label: 'iOS Music Player' },
                      { id: 'band_dongker', label: 'Dongker Punk' },
                      { id: 'band_reality_club', label: 'Reality Club' },
                      { id: 'band_perunggu', label: 'Perunggu 33x' },
                      { id: 'band_lomba_sihir', label: 'Lomba Sihir' },
                    ] as const
                  ).map((ill) => (
                    <button
                      type="button"
                      key={ill.id}
                      onClick={() => {
                        sound.playClick()
                        setIllustration(ill.id)
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border text-left cursor-pointer transition-all ${
                        illustration === ill.id
                          ? 'bg-[#FFB020] text-[#0F0F14] border-[#FFB020]'
                          : isDark
                          ? 'glass-card-dark text-slate-300'
                          : 'glass-card-light text-slate-700'
                      }`}
                    >
                      {ill.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#FFB020] text-[#0F0F14] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg  cursor-pointer transition-all"
              >
                {createdSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Tersimpan di Frame Kita!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Simpan ke Koleksi Frame Kita</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </section>

      {/* ==================== BOTTOM SECTION: USER'S SAVED & UPLOADED FRAMES ==================== */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold">
            Koleksi Frame Kita ({customFrames.length})
          </h2>
          <p className="text-xs opacity-65">
            Semua frame yang kamu upload atau buat sendiri tersimpan di sini dan otomatis muncul di
            Browse Frames.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {customFrames.map((frame) => (
            <div
              key={frame.id}
              className={`group rounded-3xl p-3 flex flex-col justify-between transition-all hover:-translate-y-1 ${
                isDark
                  ? 'glass-card-dark hover:border-[#FFB020]'
                  : 'glass-card-light hover:border-[#FFB020]'
              }`}
            >
              <div
                className={`relative w-full h-60 rounded-2xl flex items-center justify-center p-2.5 overflow-hidden ${
                  isDark ? 'bg-slate-950/60' : 'bg-slate-200/60'
                }`}
              >
                <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full bg-[#FFB020] text-[#0F0F14] text-[9px] font-extrabold">
                  MY FRAME
                </span>
                <FrameCardPreview frame={frame} className="max-h-full w-auto" />
              </div>

              <div className="mt-3">
                <h4 className="font-bold text-sm truncate">{frame.name}</h4>
                <p className="text-[11px] opacity-65">
                  {frame.layoutLabel} • by {frame.creatorName}
                </p>

                <button
                  onClick={() => {
                    sound.playClick()
                    onStartWithFrame(frame)
                  }}
                  className="mt-2.5 w-full py-2 rounded-xl bg-[#FFB020] text-[#0F0F14] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Pakai Frame Ini</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
