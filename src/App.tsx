import { useState, useEffect, useCallback } from 'react'
import {
  Home,
  Image as ImageIcon,
  Star,
  Camera,
  FolderHeart,
  Search,
  Crown,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Lock,
  Aperture,
  Globe,
  ShieldCheck,
} from 'lucide-react'
import { LandingHero } from './components/LandingHero'
import { HomeDashboard } from './components/HomeDashboard'
import { BrowseFrames } from './components/BrowseFrames'
import { MyFramesView } from './components/MyFramesView'
import { CameraStudio } from './components/CameraStudio'
import { PhotoReview } from './components/PhotoReview'
import { ArchiveGallery } from './components/ArchiveGallery'
import { AdminDashboard } from './components/AdminDashboard'
import { AuthModal } from './components/AuthModal'
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

type DashboardTab = 'home' | 'events' | 'frames' | 'my_frames' | 'studio' | 'gallery' | 'admin'

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
  {
    id: 'demo_member_01',
    name: 'Member VIP',
    email: 'vip@urbooth.id',
    role: 'member',
    status: 'active',
    photosCount: 9,
    createdAt: '2026-03-04T11:20:00Z',
  },
  {
    id: 'usr_farhan',
    name: 'Farhan Alyudin',
    email: 'farhan@urbooth.id',
    role: 'member',
    status: 'active',
    photosCount: 24,
    createdAt: '2026-05-18T14:40:00Z',
  },
  {
    id: 'usr_aqilah',
    name: 'Aqilah Naifah',
    email: 'aqilah@urbooth.id',
    role: 'member',
    status: 'active',
    photosCount: 14,
    createdAt: '2026-07-22T09:15:00Z',
  },
]

export function App() {
  const [showLandingHero, setShowLandingHero] = useState(true)
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

  const [user, setUser] = useState<User>(() => storage.getCurrentUser())
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [lockedTargetFrame, setLockedTargetFrame] = useState<FrameTemplate | null>(null)

  // Stateful Frames Catalog (17 curated uploaded frames + supports Admin ON/OFF, Expiry, Add, Delete & User Custom Frames)
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

  // Only show Active (ON) frames to normal users in Browse Frames & Studio
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

  const loadUserPhotos = useCallback(async (userId: string) => {
    try {
      const list = await storage.getUserPhotos(userId)
      setUserPhotos(list)
    } catch (e) {
      console.error('Failed to load photos:', e)
    }
  }, [])

  useEffect(() => {
    loadUserPhotos(user.id)
  }, [user.id, loadUserPhotos])

  const handleAuthSuccess = (authenticatedUser: User) => {
    storage.setCurrentUser(authenticatedUser)
    setUser(authenticatedUser)
    loadUserPhotos(authenticatedUser.id)

    // Add newly logged-in user to Admin managed list if not present
    setManagedUsers((prev) =>
      prev.some((u) => u.email === authenticatedUser.email)
        ? prev
        : [{ ...authenticatedUser, status: 'active' }, ...prev]
    )

    if (authenticatedUser.role === 'admin') {
      setShowLandingHero(false)
      setActiveTab('admin')
    } else if (lockedTargetFrame) {
      setSelectedFrame(lockedTargetFrame)
      setLockedTargetFrame(null)
    }
  }

  const handleLogout = () => {
    const guestUser = storage.logoutUser()
    setUser(guestUser)
    loadUserPhotos(guestUser.id)
    if (activeTab === 'admin') {
      setActiveTab('home')
    }
    if (selectedFrame.isLocked) {
      setSelectedFrame(DEFAULT_FRAME)
    }
  }

  const handleLockedClick = (frame: FrameTemplate) => {
    setLockedTargetFrame(frame)
    setAuthModalOpen(true)
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
    if (frame) {
      if (user.role === 'guest' && frame.isLocked) {
        handleLockedClick(frame)
        return
      }
      setSelectedFrame(frame)
    }
    setStudioMode('camera')
    setStudioStage('camera')
    setRetakeSlotIndex(null)
    setShowLandingHero(false)
    setActiveTab('studio')
  }

  const handleStartUploadWithFrame = (frame?: FrameTemplate) => {
    if (frame) {
      if (user.role === 'guest' && frame.isLocked) {
        handleLockedClick(frame)
        return
      }
      setSelectedFrame(frame)
    }
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
      userId: user.id,
      userRole: user.role,
      userName: user.name,
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
    await loadUserPhotos(user.id)
  }

  const handleDeletePhoto = async (id: string) => {
    await storage.deletePhotoSession(id)
    await loadUserPhotos(user.id)
  }

  // Sidebar Items: Admin tab is ONLY shown to Admin role!
  const sidebarItems: {
    id: DashboardTab
    label: string
    icon: typeof Home
    requiresLoginBadge?: boolean
  }[] = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'frames', label: 'FRAMES', icon: ImageIcon },
    {
      id: 'my_frames',
      label: 'FRAME KITA',
      icon: Star,
      requiresLoginBadge: user.role === 'guest',
    },
    { id: 'studio', label: 'STUDIO', icon: Camera },
    { id: 'gallery', label: 'GALERI', icon: FolderHeart },
    ...(user.role === 'admin'
      ? [{ id: 'admin' as DashboardTab, label: 'ADMIN', icon: ShieldCheck }]
      : []),
  ]

  if (showLandingHero) {
    return (
      <>
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
          onOpenAuth={() => setAuthModalOpen(true)}
          user={user}
          theme={theme}
          onThemeChange={setTheme}
          isDark={isDark}
        />

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => {
            setAuthModalOpen(false)
            setLockedTargetFrame(null)
          }}
          onSuccess={handleAuthSuccess}
          lockedFrameName={lockedTargetFrame?.name}
          isDark={isDark}
        />
      </>
    )
  }

  return (
    <div
      className={`relative min-h-screen flex flex-col transition-colors duration-300 overflow-x-hidden ${
        isDark ? 'bg-[#090A10] text-white' : 'bg-[#EEF2F9] text-slate-900'
      }`}
    >
      {/* Lightweight Static Ambient Gradient (Zero GPU Repaint Lag) */}
      <div
        className={`fixed inset-0 pointer-events-none z-0 ${
          isDark ? 'ambient-bg-dark' : 'ambient-bg-light'
        }`}
      />

      {/* Top Glassmorphic Navbar with Official URBOOTH Logo */}
      <header
        className={`sticky top-0 z-30 h-16 px-4 sm:px-6 flex items-center justify-between border-b transition-colors ${
          isDark
            ? 'bg-slate-950/75 border-white/10 backdrop-blur-md'
            : 'bg-white/80 border-slate-200/80 backdrop-blur-md'
        }`}
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              sound.playClick()
              setShowLandingHero(true)
            }}
            title="Kembali ke Landing Page 3D"
            className="flex items-center cursor-pointer group"
          >
            <img
              src="/urbooth-logo.jpg"
              alt="URBOOTH"
              className="h-10 w-auto rounded-xl bg-white px-1.5 py-0.5 shadow-sm transition-transform group-hover:scale-95"
            />
          </button>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (activeTab !== 'frames') {
                  setActiveTab('frames')
                }
              }}
              placeholder="Cari Frame (Denim, Spider-Man, Win98, The 1975, Leopard...)"
              className={`w-full pl-10 pr-4 py-2 rounded-full text-xs font-medium border focus:outline-none focus:border-[#EC4899] backdrop-blur-xl transition-colors ${
                isDark
                  ? 'bg-white/5 border-white/15 text-white placeholder-slate-400'
                  : 'bg-white/80 border-slate-300/80 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {user.role === 'guest' ? (
            <button
              onClick={() => {
                sound.playClick()
                setAuthModalOpen(true)
              }}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#EC4899] to-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Masuk / Daftar</span>
            </button>
          ) : (
            <div
              className={`hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold border ${
                user.role === 'admin'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-[#EC4899]/15 border-[#EC4899]/30 text-[#EC4899]'
              }`}
            >
              {user.role === 'admin' ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <Crown className="w-3.5 h-3.5" />
              )}
              <span>
                {user.role === 'admin' ? 'ADMIN' : 'MEMBER'} • {user.name}
              </span>
            </div>
          )}

          {/* Theme Switcher */}
          <div
            className={`flex items-center p-1 rounded-full border backdrop-blur-md ${
              isDark ? 'bg-white/5 border-white/15' : 'bg-white/80 border-slate-300'
            }`}
          >
            {(
              [
                { id: 'light', icon: Sun, label: 'Light Theme' },
                { id: 'dark', icon: Moon, label: 'Dark Theme' },
                { id: 'system', icon: Monitor, label: 'System Theme' },
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
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    active ? 'bg-[#EC4899] text-white' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              )
            })}
          </div>

          {user.role !== 'guest' ? (
            <button
              onClick={() => {
                sound.playClick()
                handleLogout()
              }}
              title="Keluar (Logout)"
              className={`p-2 rounded-full border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-white/5 border-white/15 text-slate-300 hover:text-red-400'
                  : 'bg-white/80 border-slate-300 text-slate-700 hover:text-red-600'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                sound.playClick()
                setAuthModalOpen(true)
              }}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#EC4899] to-indigo-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer shadow"
              title="Masuk Akun"
            >
              G
            </button>
          )}
        </div>
      </header>

      {/* Body: Left Glass Sidebar + Main Viewport */}
      <div className="relative z-10 flex-1 flex">
        <aside
          className={`w-20 shrink-0 border-r flex flex-col items-center justify-between py-5 select-none backdrop-blur-2xl ${
            isDark ? 'bg-slate-950/45 border-white/10' : 'bg-white/55 border-slate-200/80'
          }`}
        >
          <nav className="flex flex-col items-center space-y-3 w-full px-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive =
                activeTab === item.id ||
                (activeTab === 'events' && item.id === 'frames')
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
                    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all ${
                      isActive
                        ? item.id === 'admin'
                          ? 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-lg'
                          : 'bg-gradient-to-tr from-[#EC4899] to-indigo-500 text-white shadow-lg shadow-pink-500/30'
                        : isDark
                        ? 'text-slate-400 hover:bg-white/10 hover:text-white'
                        : 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-950'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.requiresLoginBadge && (
                      <Lock className="w-2.5 h-2.5 absolute top-1.5 right-3 text-amber-400" />
                    )}
                  </div>
                  <span
                    className={`mt-1 text-[9px] font-extrabold tracking-wider uppercase ${
                      isActive
                        ? item.id === 'admin'
                          ? 'text-amber-400'
                          : 'text-[#EC4899]'
                        : 'opacity-65'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              )
            })}
          </nav>

          <button
            onClick={() => {
              sound.playClick()
              setShowLandingHero(true)
            }}
            title="Buka Landing Page 3D"
            className={`w-10 h-10 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
              isDark
                ? 'bg-white/5 border-white/15 text-slate-300 hover:text-[#EC4899]'
                : 'bg-white/80 border-slate-300 text-slate-700 hover:text-[#EC4899]'
            }`}
          >
            <Globe className="w-4 h-4" />
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-8 py-6 overflow-y-auto max-w-[1440px] mx-auto w-full">
          {activeTab === 'home' && (
            <HomeDashboard
              frames={activeFrames}
              user={user}
              isDark={isDark}
              onStartPhotobooth={handleStartCameraWithFrame}
              onStartUpload={handleStartUploadWithFrame}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSelectFrameDetail={(frame) => {
                setSelectedFrame(frame)
                setActiveTab('frames')
              }}
            />
          )}

          {(activeTab === 'frames' || activeTab === 'events') && (
            <BrowseFrames
              frames={activeFrames}
              selectedFrame={selectedFrame}
              onSelectFrame={setSelectedFrame}
              onStartCameraSession={handleStartCameraWithFrame}
              onStartUploadSession={handleStartUploadWithFrame}
              userRole={user.role}
              onLockedClick={handleLockedClick}
              searchQuery={searchQuery}
              isDark={isDark}
              onBackToHome={() => setActiveTab('home')}
              onOpenUploadFrame={() => setActiveTab('my_frames')}
            />
          )}

          {activeTab === 'my_frames' && (
            <MyFramesView
              user={user}
              customFrames={customFrames}
              onOpenAuth={() => setAuthModalOpen(true)}
              onCreateCustomFrame={handleCreateCustomFrame}
              onStartWithFrame={handleStartCameraWithFrame}
              isDark={isDark}
            />
          )}

          {activeTab === 'admin' && user.role === 'admin' && (
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
                  user={user}
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
                  onOpenAuth={() => setAuthModalOpen(true)}
                />
              )}
            </div>
          )}

          {activeTab === 'gallery' && (
            <ArchiveGallery
              photos={userPhotos}
              user={user}
              isDark={isDark}
              onOpenAuth={() => setAuthModalOpen(true)}
              onNewSession={() => handleStartCameraWithFrame(selectedFrame)}
              onDeletePhoto={handleDeletePhoto}
            />
          )}
        </main>
      </div>

      {/* Floating 3D Landing Shortcut */}
      <button
        onClick={() => {
          sound.playClick()
          setShowLandingHero(true)
        }}
        className={`fixed bottom-4 right-4 z-30 px-4 py-2 rounded-full text-xs font-bold flex items-center space-x-2 shadow-xl cursor-pointer transition-all ${
          isDark
            ? 'glass-panel-dark text-white hover:border-[#EC4899]'
            : 'glass-panel-light text-slate-900 hover:border-[#EC4899]'
        }`}
      >
        <Aperture className="w-4 h-4 text-[#EC4899]" />
        <span>3D Hero</span>
      </button>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false)
          setLockedTargetFrame(null)
        }}
        onSuccess={handleAuthSuccess}
        lockedFrameName={lockedTargetFrame?.name}
        isDark={isDark}
      />
    </div>
  )
}
export default App
