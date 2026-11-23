export type UserRole = 'guest' | 'member' | 'admin'
export type ThemeMode = 'dark' | 'light' | 'system'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  status?: 'active' | 'suspended'
  avatar?: string
  photosCount?: number
  createdAt: string
}

export interface GlobalFeatureFlags {
  allowGuestMode: boolean
  enableVideoFrame: boolean
  enableCustomStickers: boolean
  enableUserFrameCreation: boolean
}

export type FrameCategory =
  | 'strip_1x3'
  | 'strip_1x4'
  | 'grid_2x2'
  | 'grid_2x3'
  | 'single_4r'

export type FrameThemeType =
  | 'denim_street'
  | 'newspaper'
  | 'meme_viral'
  | 'special_event'
  | 'cartoon'
  | 'band'
  | 'arcade'
  | 'retro'
  | 'film'
  | 'custom'

export type FrameIllustration =
  | 'none'
  | 'denim_jeans'
  | 'denim_patchwork'
  | 'newspaper_press'
  | 'newspaper_wanted'
  | 'meme_white_grid'
  | 'y2k_chrome'
  | 'scrapbook_tape'
  | 'ios_music_player'
  | 'cute_bunny'
  | 'cat_doodles'
  | 'bear_bakery'
  | 'rock_band'
  | 'grunge_cassette'
  | 'y2k_punk'
  | 'retro_vinyl'
  | 'maroon_ticket'
  | 'good_vibes'
  | 'halloween_spooky'
  | 'arcade_pixel'
  | 'picnic_gingham'
  | 'cinema_film'
  | 'tropical_leaves'
  | 'poseidon_gold'
  | 'band_dongker'
  | 'band_reality_club'
  | 'band_perunggu'
  | 'band_lomba_sihir'
  | 'band_sore'

export interface CustomSlotRect {
  x: number // 0..1 normalized
  y: number // 0..1 normalized
  w: number // 0..1 normalized
  h: number // 0..1 normalized
  radius?: number
  rotation?: number // degrees, rotated around slot center
  shape?: 'rect' | 'rounded' | 'oval' | 'heart'
}

export interface FrameTemplate {
  id: string
  name: string
  code: string
  category: FrameCategory
  layoutLabel: string
  themeType: FrameThemeType
  illustration: FrameIllustration
  slots: number
  cols: number
  rows: number
  aspectRatio: number
  aspectRatioLabel: string
  dimensionsLabel: string
  usageCount: number
  creatorName: string
  creatorAvatar?: string
  isLocked: boolean
  isNew?: boolean
  isCustomUserFrame?: boolean
  isActive?: boolean // Admin can toggle ON/OFF
  expiresAt?: string // ISO date string (e.g. "2026-10-01" for expired or "2027-01-01")
  customOverlayUrl?: string // Optional transparent PNG overlay uploaded by User/Admin
  imageTemplateUrl?: string // Exact raster template image with slot coordinates
  customSlots?: CustomSlotRect[]
  slotShape?: 'rect' | 'rounded' | 'oval'
  bgColor: string
  secondaryBgColor?: string
  textColor: string
  accentColor: string
  subtleBorderColor: string
  tag: string
  badgeText?: string
  description: string
  defaultVenue: string
  defaultArtist?: string
}

export type FilterId = string

export type FilterCategory =
  | 'Studio & Beauty'
  | 'Analog & Kodak'
  | 'Fuji & Japan'
  | 'Monochrome B&W'
  | 'Y2K & Cyber'
  | 'Cinematic Mood'
  | 'Retro & Lomo'
  | 'Experimental FX'

export interface PhotoFilter {
  id: FilterId
  name: string
  category: FilterCategory
  description: string
  cssFilter: string
  previewColor: string
  canvasProcess?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
}

export type VideoFilterId =
  | 'normal'
  | 'bw'
  | 'sepia'
  | 'negative'
  | 'blur'
  | 'warm'
  | 'cyber'
  | 'vintage'

export type MemeStickerCategory = 'New' | 'Trending' | 'Top Used'

export interface StickerOption {
  id: string
  label: string
  category: MemeStickerCategory
  group: 'monkey' | 'cat' | 'hamster' | 'hero' | 'meme'
  svgDataUrl: string
}

export interface PlacedSticker {
  instanceId: string
  stickerId: string
  label: string
  imageUrl: string
  xRatio: number
  yRatio: number
  scale: number
  rotation: number
}

export interface PhotoSession {
  id: string
  userId: string
  userRole: UserRole
  userName?: string
  frameId: string
  frameName: string
  filterId: FilterId
  shots: string[]
  compositeDataUrl: string
  caption: string
  venue: string
  showDate: boolean
  createdAt: string
  dimensions: {
    width: number
    height: number
  }
}

export interface CameraDevice {
  deviceId: string
  label: string
}

export interface StudioSettings {
  timerDuration: 3 | 5 | 10
  isMirrored: boolean
  soundEnabled: boolean
  flashEnabled: boolean
  aspectRatio: '4:3' | '1:1'
}
