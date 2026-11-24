import { useState, useEffect, useCallback } from 'react'
import {
  Home,
  Image as ImageIcon,
  Star,
  Camera,
  FolderHeart,
  Search,
  Sun,
  Moon,
  Monitor,
  LogOut,
  ShieldCheck,
  ExternalLink,
  Heart,
} from 'lucide-react'
import { LandingHero } from './components/LandingHero'
import { HomeDashboard } from './components/HomeDashboard'
import { BrowseFrames } from './components/BrowseFrames'
import { MyFramesView } from './components/MyFramesView'
import { CameraStudio } from './components/CameraStudio'
import { PhotoReview } from './components/PhotoReview'
import { ArchiveGallery } from './components/ArchiveGallery'
import { AdminDashboard } from './components/AdminDashboard'
import { AdminLoginPage } from './components/AdminLoginPage'
import { SaweriaModal } from './components/SaweriaModal'
import type {
  FilterId,
  FrameTemplate,
  GlobalFeatureFlags,
  PhotoSession,
  StudioSettings,
  ThemeMode,
  User,
} from './types'
import { DEFAULT_FRAME, FRAME_TEMPLATES } from './constants/frames'
import { storage } from './utils/storage'
import { sound } from './utils/sound'

type DashboardTab = 'home' | 'frames' | 'my_frames' | 'studio' | 'gallery'

const PUBLIC_VISITOR_USER: User = {
  id: 'local_visitor',
  name: 'Pengunjung',
  email: 'visitor@urbooth.id',
  role: 'member',
  status: 'active',
  createdAt: '2026-01-01T00:00:00Z',
}

const INITIAL_USERS: User[] = [
  {
    id: 'admin_urbooth_01',
    name: 'Admin Urbooth',
    email: 'admin@urbooth.id',
    role: 'admin',
    status: 'active',
    photosCount: 18,
    createdAt: '2026-01-12T08:00:00Z',
  },
]

function checkIsAdminUrl(): boolean {
  const path = window.location.pathname.replace(/\/+$/, '')
  const hash = window.location.hash.replace(/\/+$/, '')
  return path === '/admin' || hash === '#/admin' || hash === '#admin'
}

export function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => checkIsAdminUrl())
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(
    () => sessionStorage.getItem('urbooth_admin_auth') === '1'
  )

  useEffect(() => {
    const syncRoute = () => setIsAdminRoute(checkIsAdminUrl())
    window.addEventListener('popstate', syncRoute)
    window.addEventListener('hashchange', syncRoute)
    return () => {
      window.removeEventListener('popstate', syncRoute)
      window.removeEventListener('hashchange', syncRoute)
    }
  }, [])

  const [showLandingHero, setShowLandingHero] = useState(true)
  const [donateModalOpen, setDonateModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<DashboardTab>('home')
  const [studioStage, setStudioStage] = useState<'camera' | 'review'>('camera')
  const [studioMode, setStudioMode] = useState<'camera' | 'upload'>('camera')

  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [systemDark, setSystemDark] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const isDark = theme === 'dark' || (theme === 'system' && systemDark)

  // Stateful Frames Catalog (22 curated uploaded frames + supports Admin ON/OFF, Expiry, Add, Delete & User Custom Frames)
  const [framesCatalog, setFramesCatalog] = useState<FrameTemplate[]>(FRAME_TEMPLATES)
  const [customFrames, setCustomFrames] = useState<FrameTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('urbooth_custom_frames_v4')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Managed Users & Global Feature Flags (Admin Panel)
  const [managedUsers, setManagedUsers] = useState<User[]>(INITIAL_USERS)
  const [featureFlags, setFeatureFlags] = useState<GlobalFeatureFlags>({
    allowGuestMode: true,
    enableVideoFrame: true,
    enableCustomStickers: true,
    enableUserFrameCreation: true,
  })

  // Only show Active (ON) frames to normal visitors in Browse Frames & Studio
  const activeFrames = framesCatalog.filter((f) => f.isActive !== false)

  const [selectedFrame, setSelectedFrame] = useState<FrameTemplate>(DEFAULT_FRAME)
  const [searchQuery, setSearchQuery] = useState('')
  const [capturedShots, setCapturedShots] = useState<string[]>([])
  const [capturedVideoClips, setCapturedVideoClips] = useState<string[][]>([])
  const [capturedVideoUrls, setCapturedVideoUrls] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterId>('natural')
  const [retakeSlotIndex, setRetakeSlotIndex] = useState<number | null>(null)

  const [settings, setSettings] = useState<StudioSettings>({
    timerDuration: 3,
    isMirrored: true,
    soundEnabled: true,
    flashEnabled: true,
    aspectRatio: '4:3',
  })

  const [userPhotos, setUserPhotos] = useState<PhotoSession[]>([])

  const loadUserPhotos = useCallback(async () => {
    try {
      const list = await storage.getUserPhotos(PUBLIC_VISITOR_USER.id)
      setUserPhotos(list)
    } catch (e) {
      console.error('Failed to load photos:', e)
    }
  }, [])

  useEffect(() => {
    loadUserPhotos()
  }, [loadUserPhotos])

  const handleAdminLoginSuccess = () => {
    sessionStorage.setItem('urbooth_admin_auth', '1')
    setIsAdminAuthenticated(true)
  }

  const handleAdminLogout = () => {
    sessionStorage.removeItem('urbooth_admin_auth')
    setIsAdminAuthenticated(false)
  }

  const navigateToPublicSite = () => {
    window.history.pushState({}, '', '/')
    setIsAdminRoute(false)
    setShowLandingHero(false)
    setActiveTab('home')
  }

  // User adds custom frame (also immediately added to framesCatalog!)
  const handleCreateCustomFrame = (newFrame: FrameTemplate) => {
    const updatedCustom = [newFrame, ...customFrames]
    setCustomFrames(updatedCustom)
    setFramesCatalog((prev) => [newFrame, ...prev])
    try {
      localStorage.setItem('urbooth_custom_frames_v4', JSON.stringify(updatedCustom))
    } catch {
      // ignore
    }
    setSelectedFrame(newFrame)
  }

  // Admin Frame Actions
  const handleToggleFrameActive = (frameId: string) => {
    setFramesCatalog((prev) =>
      prev.map((f) => (f.id === frameId ? { ...f, isActive: f.isActive === false } : f))
    )
  }

  const handleToggleFramePro = (frameId: string) => {
    setFramesCatalog((prev) =>
      prev.map((f) => (f.id === frameId ? { ...f, isLocked: !f.isLocked } : f))
    )
  }

  const handleExtendFrameExpiry = (frameId: string) => {
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + 30)
    const iso = nextDate.toISOString().slice(0, 10)
    setFramesCatalog((prev) =>
      prev.map((f) => (f.id === frameId ? { ...f, expiresAt: iso, isActive: true } : f))
    )
  }

  const handleDisableAllExpired = () => {
    const today = new Date().toISOString().slice(0, 10)
    setFramesCatalog((prev) =>
      prev.map((f) => (f.expiresAt && f.expiresAt < today ? { ...f, isActive: false } : f))
    )
  }

  const handleDeleteFrame = (frameId: string) => {
    setFramesCatalog((prev) => prev.filter((f) => f.id !== frameId))
  }

  // Admin User Actions
  const handleAddUser = (u: User) => setManagedUsers((prev) => [u, ...prev])
  const handleToggleUserStatus = (userId: string) => {
    setManagedUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' }
          : u
      )
    )
  }
  const handleToggleUserRole = (userId: string) => {
    setManagedUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, role: u.role === 'admin' ? 'member' : 'admin' } : u
      )
    )
  }
  const handleDeleteUser = (userId: string) => {
    setManagedUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const handleStartCameraWithFrame = (frame?: FrameTemplate) => {
    if (frame) setSelectedFrame(frame)
    setStudioMode('camera')
    setStudioStage('camera')
    setRetakeSlotIndex(null)
    setShowLandingHero(false)
    setActiveTab('studio')
  }

  const handleStartUploadWithFrame = (frame?: FrameTemplate) => {
    if (frame) setSelectedFrame(frame)
    setStudioMode('upload')
    setStudioStage('camera')
    setRetakeSlotIndex(null)
    setShowLandingHero(false)
    setActiveTab('studio')
  }

  const handleCompleteCapture = (
    shots: string[],
    filterFromCamera?: FilterId,
    recordedClips?: string[][],
    recordedVideoUrls?: string[]
  ) => {
    if (filterFromCamera) setActiveFilter(filterFromCamera)
    if (retakeSlotIndex !== null) {
      const updated = [...capturedShots]
      updated[retakeSlotIndex] = shots[0] || shots[shots.length - 1]
      setCapturedShots(updated)
      if (recordedClips && recordedClips[0]) {
        const updatedClips = [...capturedVideoClips]
        updatedClips[retakeSlotIndex] = recordedClips[0]
        setCapturedVideoClips(updatedClips)
      }
      if (recordedVideoUrls && recordedVideoUrls[0]) {
        const updatedUrls = [...capturedVideoUrls]
        updatedUrls[retakeSlotIndex] = recordedVideoUrls[0]
        setCapturedVideoUrls(updatedUrls)
      }
      setRetakeSlotIndex(null)
    } else {
      setCapturedShots(shots)
      setCapturedVideoClips(recordedClips || [])
      setCapturedVideoUrls(recordedVideoUrls || [])
    }
    setStudioStage('review')
  }

  const handleRetakeSlot = (slotIndex: number) => {
    setRetakeSlotIndex(slotIndex)
    setStudioMode('camera')
    setStudioStage('camera')
  }

  const handleSaveToArchive = async (
    compositeDataUrl: string,
    caption: string,
    venue: string,
    filterId: FilterId
  ) => {
    const session: PhotoSession = {
      id: `sesh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: PUBLIC_VISITOR_USER.id,
      userRole: PUBLIC_VISITOR_USER.role,
      userName: PUBLIC_VISITOR_USER.name,
      frameId: selectedFrame.id,
      frameName: selectedFrame.name,
      filterId,
      shots: capturedShots,
      compositeDataUrl,
      caption,
      venue,
      showDate: true,
      createdAt: new Date().toISOString(),
      dimensions: { width: 1200, height: 3600 },
    }

    await storage.savePhotoSession(session)
    await loadUserPhotos()
  }

  const handleDeletePhoto = async (id: string) => {
    await storage.deletePhotoSession(id)
    await loadUserPhotos()
  }

  // ==================== HALAMAN ADMIN TERPISAH (/admin) ====================
  if (isAdminRoute) {
    if (!isAdminAuthenticated) {
      return (
        <AdminLoginPage
          isDark={isDark}
          onLoginSuccess={handleAdminLoginSuccess}
          onBackToSite={navigateToPublicSite}
        />
      )
    }

    return (
      <div
        className={`relative min-h-screen flex flex-col transition-colors duration-300 ${
          isDark ? 'bg-[#0F0F14] text-white' : 'bg-[#FFF4E0] text-[#0F0F14]'
        }`}
      >
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="ambient-orb-accent -top-24 -left-24 w-[360px] h-[360px]" />
          <div className="ambient-orb-hover top-1/3 -right-24 w-[380px] h-[380px]" />
          <div className="ambient-orb-accent -bottom-24 left-1/3 w-[340px] h-[340px]" />
        </div>

        <header
          className={`sticky top-0 z-30 h-16 px-4 sm:px-8 flex items-center justify-between border-b ${
            isDark
              ? 'bg-[#0F0F14]/80 border-white/12 backdrop-blur-md'
              : 'bg-white/85 border-slate-200 backdrop-blur-md'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="logo-box">
              <img src="/urbooth-logo.jpg" alt="Urbooth" className="h-8 w-auto rounded-md" />
            </span>
            <span className="badge-outline inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Panel Admin</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                sound.playClick()
                navigateToPublicSite()
              }}
              className={`btn-secondary px-3.5 py-2 text-[14px] flex items-center gap-1.5 cursor-pointer ${
                isDark ? '' : '!bg-white !text-[#0F0F14] !border-slate-300'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Lihat website</span>
            </button>

            <button
              onClick={() => {
                sound.playClick()
                handleAdminLogout()
              }}
              className="px-3.5 py-2 rounded-[16px] bg-red-500/15 border border-red-500/35 text-red-400 hover:bg-red-500/25 text-[14px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar admin</span>
            </button>
          </div>
        </header>

        <main className="relative z-10 flex-1 px-4 sm:px-8 py-6 max-w-[1440px] mx-auto w-full">
          <AdminDashboard
            frames={framesCatalog}
            onToggleFrameActive={handleToggleFrameActive}
            onToggleFramePro={handleToggleFramePro}
            onExtendFrameExpiry={handleExtendFrameExpiry}
            onDisableAllExpired={handleDisableAllExpired}
            onAddFrame={(f) => setFramesCatalog((prev) => [f, ...prev])}
            onDeleteFrame={handleDeleteFrame}
            managedUsers={managedUsers}
            onAddUser={handleAddUser}
            onToggleUserStatus={handleToggleUserStatus}
            onToggleUserRole={handleToggleUserRole}
            onDeleteUser={handleDeleteUser}
            featureFlags={featureFlags}
            onUpdateFeatureFlags={(partial) =>
              setFeatureFlags((prev) => ({ ...prev, ...partial }))
            }
            isDark={isDark}
          />
        </main>
      </div>
    )
  }

  // ==================== TAMPILAN PENGUNJUNG BIASA (TANPA LOGIN & TANPA TOMBOL ADMIN) ====================
  const sidebarItems: {
    id: DashboardTab
    label: string
    icon: typeof Home
  }[] = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'frames', label: 'Frame', icon: ImageIcon },
    { id: 'my_frames', label: 'Buat Frame', icon: Star },
    { id: 'studio', label: 'Studio', icon: Camera },
    { id: 'gallery', label: 'Galeri', icon: FolderHeart },
  ]

  if (showLandingHero) {
    return (
      <LandingHero
        frames={activeFrames}
        onStart={() => {
          setShowLandingHero(false)
          setActiveTab('home')
        }}
        onSelectFrameFromLanding={(frame) => {
          setSelectedFrame(frame)
          setShowLandingHero(false)
          setActiveTab('frames')
        }}
        onNavigateTab={(tab) => {
          setShowLandingHero(false)
          setActiveTab(tab)
        }}
        theme={theme}
        onThemeChange={setTheme}
        isDark={isDark}
      />
    )
  }

  return (
    <div
      className={`relative min-h-screen flex flex-col transition-colors duration-300 overflow-x-hidden ${
        isDark ? 'bg-[#0F0F14] text-white' : 'bg-[#FFF4E0] text-[#0F0F14]'
      }`}
    >
      {/* Solid Ambient Orbs Behind Glass (No Gradients!) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="ambient-orb-accent -top-28 -left-20 w-[380px] h-[380px]" />
        <div className="ambient-orb-hover top-1/3 -right-24 w-[400px] h-[400px]" />
        <div className="ambient-orb-accent -bottom-28 left-1/3 w-[360px] h-[360px]" />
      </div>

      {/* Top Glassmorphic Navbar */}
      <header
        className={`sticky top-0 z-30 h-16 px-4 sm:px-6 flex items-center justify-between border-b transition-colors ${
          isDark
            ? 'bg-white/6 border-white/12 backdrop-blur-lg'
            : 'bg-white/85 border-slate-200 backdrop-blur-lg'
        }`}
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              sound.playClick()
              setShowLandingHero(true)
            }}
            title="Kembali ke halaman awal"
            className="logo-box cursor-pointer transition-transform hover:scale-95"
          >
            <img src="/urbooth-logo.jpg" alt="Urbooth" className="h-8 w-auto rounded-md" />
          </button>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search
              className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-[#B8B8C4]' : 'text-slate-500'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (activeTab !== 'frames') {
                  setActiveTab('frames')
                }
              }}
              placeholder="Cari frame (Denim, Spider-Man, Apple Music, Perunggu...)"
              className={`w-full pl-10 pr-4 py-2 rounded-[16px] text-[14px] font-normal border focus:outline-none focus:border-[#FFB020] transition-colors ${
                isDark
                  ? 'bg-white/6 border-white/12 text-white placeholder-[#B8B8C4]'
                  : 'bg-white border-slate-300 text-[#0F0F14] placeholder-slate-500'
              }`}
            />
          </div>
        </div>

        {/* Right Controls: Donate Saweria + Secondary Studio CTA + Theme Switcher */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <button
            onClick={() => {
              sound.playClick()
              setDonateModalOpen(true)
            }}
            title="Dukung Urbooth via Saweria"
            className={`btn-secondary px-3.5 py-2 text-[14px] flex items-center space-x-1.5 cursor-pointer ${
              isDark ? '' : '!bg-white !text-[#0F0F14] !border-slate-300'
            }`}
          >
            <Heart className="w-4 h-4 text-[#FFB020] fill-current" />
            <span className="hidden md:inline">Saweria</span>
          </button>

          <button
            onClick={() => {
              sound.playClick()
              handleStartCameraWithFrame(selectedFrame)
            }}
            className={`hidden sm:flex btn-secondary px-4 py-2 text-[14px] items-center space-x-1.5 cursor-pointer ${
              isDark ? '' : '!bg-white !text-[#0F0F14] !border-slate-300'
            }`}
          >
            <Camera className="w-4 h-4 text-[#FFB020]" />
            <span>Mulai Foto</span>
          </button>

          {/* Theme Switcher */}
          <div
            className={`flex items-center p-1 rounded-[16px] border ${
              isDark ? 'bg-white/6 border-white/12' : 'bg-white border-slate-300'
            }`}
          >
            {(
              [
                { id: 'light', icon: Sun, label: 'Mode terang' },
                { id: 'dark', icon: Moon, label: 'Mode gelap' },
                { id: 'system', icon: Monitor, label: 'Ikuti sistem' },
              ] as const
            ).map((item) => {
              const Icon = item.icon
              const active = theme === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.playClick()
                    setTheme(item.id)
                  }}
                  title={item.label}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    active
                      ? 'bg-[#FFB020] text-[#0F0F14]'
                      : isDark
                      ? 'text-[#B8B8C4] hover:text-white'
                      : 'text-slate-600 hover:text-[#0F0F14]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Body: Left High-Contrast Sidebar + Main Viewport */}
      <div className="relative z-10 flex-1 flex">
        <aside
          className={`w-24 shrink-0 border-r flex flex-col items-center py-5 select-none backdrop-blur-lg ${
            isDark ? 'bg-white/6 border-white/12' : 'bg-white/85 border-slate-200'
          }`}
        >
          <nav className="flex flex-col items-center space-y-3.5 w-full px-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.playClick()
                    setActiveTab(item.id)
                  }}
                  className="group relative w-full flex flex-col items-center cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 rounded-[16px] flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-[#FFB020] text-[#0F0F14]'
                        : isDark
                        ? 'text-[#B8B8C4] hover:bg-white/10 hover:text-white'
                        : 'text-slate-700 hover:bg-slate-900/5 hover:text-[#0F0F14]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`mt-1.5 text-[12px] font-semibold text-center leading-tight ${
                      isActive
                        ? 'text-[#FFB020]'
                        : isDark
                        ? 'text-[#B8B8C4] group-hover:text-white'
                        : 'text-slate-700 group-hover:text-[#0F0F14]'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-8 py-6 overflow-y-auto max-w-[1440px] mx-auto w-full">
          {activeTab === 'home' && (
            <HomeDashboard
              frames={activeFrames}
              isDark={isDark}
              onStartPhotobooth={handleStartCameraWithFrame}
              onStartUpload={handleStartUploadWithFrame}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSelectFrameDetail={(frame) => {
                setSelectedFrame(frame)
                setActiveTab('frames')
              }}
              onOpenDonate={() => setDonateModalOpen(true)}
            />
          )}

          {activeTab === 'frames' && (
            <BrowseFrames
              frames={activeFrames}
              selectedFrame={selectedFrame}
              onSelectFrame={setSelectedFrame}
              onStartCameraSession={handleStartCameraWithFrame}
              onStartUploadSession={handleStartUploadWithFrame}
              userRole="member"
              onLockedClick={() => {}}
              searchQuery={searchQuery}
              isDark={isDark}
              onBackToHome={() => setActiveTab('home')}
              onOpenUploadFrame={() => setActiveTab('my_frames')}
            />
          )}

          {activeTab === 'my_frames' && (
            <MyFramesView
              customFrames={customFrames}
              onCreateCustomFrame={handleCreateCustomFrame}
              onStartWithFrame={handleStartCameraWithFrame}
              isDark={isDark}
            />
          )}

          {activeTab === 'studio' && (
            <div>
              {studioStage === 'camera' ? (
                <CameraStudio
                  selectedFrame={selectedFrame}
                  onCompleteCapture={handleCompleteCapture}
                  settings={settings}
                  onUpdateSettings={(newSettings) =>
                    setSettings((prev) => ({ ...prev, ...newSettings }))
                  }
                  retakeSlotIndex={retakeSlotIndex}
                  initialMode={studioMode}
                  isDark={isDark}
                  onBackToBrowse={() => setActiveTab('frames')}
                />
              ) : (
                <PhotoReview
                  shots={capturedShots}
                  videoClips={capturedVideoClips}
                  videoUrls={capturedVideoUrls}
                  isMirrored={settings.isMirrored}
                  frame={selectedFrame}
                  allFrames={activeFrames}
                  onSelectFrame={setSelectedFrame}
                  initialFilter={activeFilter}
                  user={PUBLIC_VISITOR_USER}
                  isDark={isDark}
                  onRetakeAll={() => {
                    setCapturedShots([])
                    setCapturedVideoClips([])
                    setCapturedVideoUrls([])
                    setRetakeSlotIndex(null)
                    setStudioStage('camera')
                  }}
                  onRetakeSlot={handleRetakeSlot}
                  onSaveToArchive={handleSaveToArchive}
                />
              )}
            </div>
          )}

          {activeTab === 'gallery' && (
            <ArchiveGallery
              photos={userPhotos}
              isDark={isDark}
              onNewSession={() => handleStartCameraWithFrame(selectedFrame)}
              onDeletePhoto={handleDeletePhoto}
            />
          )}
        </main>
      </div>

      <SaweriaModal
        isOpen={donateModalOpen}
        onClose={() => setDonateModalOpen(false)}
        isDark={isDark}
      />
    </div>
  )
}
export default App
