import React, { useState } from 'react'
import {
  ShieldCheck,
  Layers,
  Users,
  Settings,
  Plus,
  Trash2,
  Power,
  AlertTriangle,
  Search,
  Calendar,
  Upload,
  Check,
  UserCheck,
  UserX,
  Crown,
} from 'lucide-react'
import type { FrameTemplate, GlobalFeatureFlags, User } from '../types'
import { sound } from '../utils/sound'

interface AdminDashboardProps {
  frames: FrameTemplate[]
  onToggleFrameActive: (frameId: string) => void
  onToggleFramePro: (frameId: string) => void
  onExtendFrameExpiry: (frameId: string) => void
  onDisableAllExpired: () => void
  onAddFrame: (frame: FrameTemplate) => void
  onDeleteFrame: (frameId: string) => void
  managedUsers: User[]
  onAddUser: (u: User) => void
  onToggleUserStatus: (userId: string) => void
  onToggleUserRole: (userId: string) => void
  onDeleteUser: (userId: string) => void
  featureFlags: GlobalFeatureFlags
  onUpdateFeatureFlags: (flags: Partial<GlobalFeatureFlags>) => void
  isDark: boolean
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  frames,
  onToggleFrameActive,
  onToggleFramePro,
  onExtendFrameExpiry,
  onDisableAllExpired,
  onAddFrame,
  onDeleteFrame,
  managedUsers,
  onAddUser,
  onToggleUserStatus,
  onToggleUserRole,
  onDeleteUser,
  featureFlags,
  onUpdateFeatureFlags,
  isDark,
}) => {
  const [tab, setTab] = useState<'frames' | 'users' | 'settings'>('frames')
  const [frameSearch, setFrameSearch] = useState('')
  const [frameFilter, setFrameFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all')

  // Add Frame Form state
  const [showAddFrame, setShowAddFrame] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTag, setNewTag] = useState('SPECIAL EVENT')
  const [newSlots, setNewSlots] = useState<3 | 4 | 6>(4)
  const [newBg, setNewBg] = useState('#1E3A5F')
  const [newExpiry, setNewExpiry] = useState('2027-06-30')
  const [newOverlayUrl, setNewOverlayUrl] = useState<string>('')

  // Add User Form state
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState<'member' | 'admin'>('member')

  const today = new Date().toISOString().slice(0, 10)
  const isFrameExpired = (f: FrameTemplate) => Boolean(f.expiresAt && f.expiresAt < today)

  const activeCount = frames.filter((f) => f.isActive !== false).length
  const expiredCount = frames.filter((f) => isFrameExpired(f)).length

  const visibleFrames = frames.filter((f) => {
    const matchesSearch =
      !frameSearch.trim() ||
      f.name.toLowerCase().includes(frameSearch.toLowerCase()) ||
      f.code.toLowerCase().includes(frameSearch.toLowerCase())
    const active = f.isActive !== false
    const expired = isFrameExpired(f)

    if (frameFilter === 'active') return matchesSearch && active
    if (frameFilter === 'inactive') return matchesSearch && !active
    if (frameFilter === 'expired') return matchesSearch && expired
    return matchesSearch
  })

  const handleOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setNewOverlayUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleCreateAdminFrame = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    sound.playShutter()

    const created: FrameTemplate = {
      id: `admin_frame_${Date.now()}`,
      name: newName.trim(),
      code: `ADM-${Math.floor(100 + Math.random() * 899)}`,
      category: newSlots === 6 ? 'grid_2x3' : newSlots === 4 ? 'strip_1x4' : 'strip_1x3',
      layoutLabel: newSlots === 6 ? '4R (2x3 Grid)' : `1x${newSlots} Strip`,
      themeType: 'special_event',
      illustration: newOverlayUrl ? 'none' : 'denim_jeans',
      slots: newSlots,
      cols: newSlots === 6 ? 2 : 1,
      rows: newSlots === 6 ? 3 : newSlots,
      slotShape: 'rect',
      aspectRatio: 4 / 3,
      aspectRatioLabel: '4:3',
      dimensionsLabel: '1200 × 3600px',
      usageCount: 0,
      creatorName: 'Admin Urbooth',
      isLocked: false,
      isActive: true,
      expiresAt: newExpiry,
      customOverlayUrl: newOverlayUrl || undefined,
      bgColor: newBg,
      textColor: '#FFFFFF',
      accentColor: '#EC4899',
      subtleBorderColor: '#FFFFFF',
      tag: newTag,
      badgeText: 'NEW',
      description: 'Frame resmi yang ditambahkan oleh Admin Urbooth.',
      defaultVenue: newName.trim().toUpperCase(),
    }

    onAddFrame(created)
    setNewName('')
    setNewOverlayUrl('')
    setShowAddFrame(false)
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserName.trim() || !newUserEmail.trim()) return
    sound.playClick()
    onAddUser({
      id: `usr_${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      status: 'active',
      photosCount: 0,
      createdAt: new Date().toISOString(),
    })
    setNewUserName('')
    setNewUserEmail('')
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Admin Header Banner */}
      <div
        className={`rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark ? 'glass-panel-dark' : 'glass-panel-light'
        }`}
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-[#EC4899] flex items-center justify-center text-white shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              ADMINISTRATOR CONTROL CENTER
            </span>
            <h1 className="text-2xl font-extrabold">Admin Panel URBOOTH</h1>
          </div>
        </div>

        {/* Admin Sub-Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { id: 'frames', label: `Kelola Frame (${frames.length})`, icon: Layers },
              { id: 'users', label: `Kelola User (${managedUsers.length})`, icon: Users },
              { id: 'settings', label: 'Fitur Global', icon: Settings },
            ] as const
          ).map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.playClick()
                  setTab(item.id)
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer transition-all ${
                  active
                    ? 'bg-[#EC4899] text-white shadow-lg shadow-pink-500/25'
                    : isDark
                    ? 'glass-card-dark text-slate-300 hover:text-white'
                    : 'glass-card-light text-slate-700 hover:text-black'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Template Frame', value: frames.length, color: 'text-sky-400' },
          { label: 'Frame Aktif (ON)', value: activeCount, color: 'text-emerald-400' },
          { label: 'Frame Expired (Lewat Waktu)', value: expiredCount, color: 'text-amber-400' },
          { label: 'Total Pengguna Terdaftar', value: managedUsers.length, color: 'text-[#EC4899]' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`p-4 rounded-2xl ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}
          >
            <p className="text-[11px] font-semibold opacity-65">{stat.label}</p>
            <p className={`text-2xl font-display font-black mt-1 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ==================== TAB 1: KELOLA FRAME (ON/OFF, EXPIRED, ADD) ==================== */}
      {tab === 'frames' && (
        <div
          className={`rounded-3xl p-6 space-y-5 ${
            isDark ? 'glass-panel-dark' : 'glass-panel-light'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center flex-wrap gap-2">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'active', label: 'Aktif (ON)' },
                  { id: 'inactive', label: 'Nonaktif (OFF)' },
                  { id: 'expired', label: `Expired (${expiredCount})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    sound.playClick()
                    setFrameFilter(f.id)
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    frameFilter === f.id
                      ? 'bg-[#EC4899] text-white'
                      : isDark
                      ? 'bg-white/5 text-slate-300'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {expiredCount > 0 && (
                <button
                  onClick={() => {
                    sound.playClick()
                    onDisableAllExpired()
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Matikan Semua Expired</span>
                </button>
              )}

              <button
                onClick={() => {
                  sound.playClick()
                  setShowAddFrame(!showAddFrame)
                }}
                className="px-4 py-2 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Frame Baru</span>
              </button>
            </div>
          </div>

          {/* Add Frame Form Drawer */}
          {showAddFrame && (
            <form
              onSubmit={handleCreateAdminFrame}
              className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-slate-950/60 border-white/15' : 'bg-slate-50 border-slate-300'
              }`}
            >
              <h3 className="text-sm font-extrabold">Tambah Template Frame Baru</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nama Frame (misal: Konser Indie 2026)"
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold ${
                    isDark
                      ? 'bg-white/5 border-white/15 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Kategori / Tag"
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold ${
                    isDark
                      ? 'bg-white/5 border-white/15 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <select
                  value={newSlots}
                  onChange={(e) => setNewSlots(Number(e.target.value) as 3 | 4 | 6)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold ${
                    isDark
                      ? 'bg-slate-900 border-white/15 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value={3}>1x3 Strip (3 Foto)</option>
                  <option value={4}>1x4 Strip (4 Foto)</option>
                  <option value={6}>2x3 Grid (6 Foto)</option>
                </select>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 opacity-60 shrink-0" />
                  <input
                    type="date"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${
                      isDark
                        ? 'bg-white/5 border-white/15 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold flex items-center gap-2">
                    <span>Warna Dasar:</span>
                    <input
                      type="color"
                      value={newBg}
                      onChange={(e) => setNewBg(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </label>

                  <label className="px-3 py-2 rounded-xl border border-dashed border-[#EC4899]/60 text-xs font-bold text-[#EC4899] flex items-center gap-1.5 cursor-pointer hover:bg-[#EC4899]/10">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{newOverlayUrl ? 'Overlay PNG Siap!' : 'Upload Overlay PNG (Opsional)'}</span>
                    <input type="file" accept="image/png" onChange={handleOverlayUpload} className="hidden" />
                  </label>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Publikasikan Frame</span>
                </button>
              </div>
            </form>
          )}

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              value={frameSearch}
              onChange={(e) => setFrameSearch(e.target.value)}
              placeholder="Cari nama atau kode frame..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#EC4899] ${
                isDark
                  ? 'bg-white/5 border-white/15 text-white'
                  : 'bg-slate-100 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Frame Management Table */}
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 uppercase text-[10px] font-mono opacity-65">
                <tr>
                  <th className="py-3 px-3">Frame & Kode</th>
                  <th className="py-3 px-3">Layout</th>
                  <th className="py-3 px-3">Masa Berlaku</th>
                  <th className="py-3 px-3">Akses</th>
                  <th className="py-3 px-3">Status (ON/OFF)</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visibleFrames.slice(0, 50).map((f) => {
                  const active = f.isActive !== false
                  const expired = isFrameExpired(f)
                  return (
                    <tr key={f.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className="w-4 h-4 rounded-md border border-white/20 shrink-0"
                            style={{ backgroundColor: f.bgColor }}
                          />
                          <div>
                            <div className="font-bold">{f.name}</div>
                            <div className="text-[10px] font-mono opacity-60">
                              {f.code} • by {f.creatorName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">{f.layoutLabel}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-mono text-[11px] ${
                              expired ? 'text-red-400 font-bold' : 'opacity-75'
                            }`}
                          >
                            {f.expiresAt || 'Selamanya'}
                          </span>
                          {expired && (
                            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-extrabold">
                              EXPIRED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => {
                            sound.playClick()
                            onToggleFramePro(f.id)
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                            f.isLocked
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          }`}
                        >
                          {f.isLocked ? 'PRO' : 'GRATIS'}
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => {
                            sound.playClick()
                            onToggleFrameActive(f.id)
                          }}
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                            active
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-zinc-700/40 text-zinc-400 border border-zinc-600/40'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{active ? 'ON' : 'OFF'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {expired && (
                            <button
                              onClick={() => {
                                sound.playClick()
                                onExtendFrameExpiry(f.id)
                              }}
                              className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] font-bold hover:bg-indigo-500/30 cursor-pointer"
                            >
                              +30 Hari
                            </button>
                          )}
                          <button
                            onClick={() => {
                              sound.playClick()
                              onDeleteFrame(f.id)
                            }}
                            title="Hapus Frame"
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: KELOLA USER ==================== */}
      {tab === 'users' && (
        <div
          className={`rounded-3xl p-6 space-y-6 ${
            isDark ? 'glass-panel-dark' : 'glass-panel-light'
          }`}
        >
          {/* Add New User Form */}
          <form
            onSubmit={handleCreateUser}
            className={`p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-4 gap-3 items-center ${
              isDark ? 'bg-slate-950/50 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <input
              type="text"
              required
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Nama Lengkap User"
              className={`px-3 py-2 rounded-xl border text-xs font-semibold ${
                isDark
                  ? 'bg-white/5 border-white/15 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <input
              type="email"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="email@urbooth.id"
              className={`px-3 py-2 rounded-xl border text-xs font-semibold ${
                isDark
                  ? 'bg-white/5 border-white/15 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as 'member' | 'admin')}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold ${
                isDark
                  ? 'bg-slate-900 border-white/15 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <option value="member">Role: Member</option>
              <option value="admin">Role: Admin</option>
            </select>
            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah User</span>
            </button>
          </form>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 uppercase text-[10px] font-mono opacity-65">
                <tr>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Status Akun</th>
                  <th className="py-3 px-3">Tanggal Bergabung</th>
                  <th className="py-3 px-3 text-right">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {managedUsers.map((u) => {
                  const isSuspended = u.status === 'suspended'
                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold">{u.name}</div>
                        <div className="text-[11px] opacity-60 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => {
                            sound.playClick()
                            onToggleUserRole(u.id)
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase flex items-center gap-1 cursor-pointer ${
                            u.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {u.role === 'admin' && <Crown className="w-3 h-3" />}
                          <span>{u.role}</span>
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isSuspended
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {isSuspended ? 'SUSPENDED' : 'AKTIF'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] opacity-70">
                        {new Date(u.createdAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              sound.playClick()
                              onToggleUserStatus(u.id)
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                              isSuspended
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {isSuspended ? (
                              <>
                                <UserCheck className="w-3 h-3" />
                                <span>Aktifkan</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3" />
                                <span>Suspend</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              sound.playClick()
                              onDeleteUser(u.id)
                            }}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: FITUR GLOBAL ==================== */}
      {tab === 'settings' && (
        <div
          className={`rounded-3xl p-6 space-y-4 ${
            isDark ? 'glass-panel-dark' : 'glass-panel-light'
          }`}
        >
          <h3 className="text-base font-extrabold mb-2">Kontrol Fitur Global Platform</h3>

          {(
            [
              {
                key: 'allowGuestMode',
                title: 'Izinkan Mode Tamu (Guest Mode)',
                desc: 'Pengunjung dapat mencoba photobooth tanpa harus login terlebih dahulu.',
              },
              {
                key: 'enableVideoFrame',
                title: 'Aktifkan Video Frame & Timelapse',
                desc: 'Rekam klip video otomatis saat sesi foto berlangsung untuk ekspor .WEBM.',
              },
              {
                key: 'enableCustomStickers',
                title: 'Aktifkan Upload Stiker Custom + Hapus Background',
                desc: 'User dapat mengunggah stiker pribadi dengan pemotongan background otomatis.',
              },
              {
                key: 'enableUserFrameCreation',
                title: 'Izinkan User Membuat & Menambah Frame Sendiri',
                desc: 'Member dapat mendesain atau mengunggah overlay frame PNG di menu Frame Kita.',
              },
            ] as const
          ).map((item) => {
            const val = featureFlags[item.key]
            return (
              <div
                key={item.key}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <h4 className="font-bold text-sm">{item.title}</h4>
                  <p className="text-xs opacity-65 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => {
                    sound.playClick()
                    onUpdateFeatureFlags({ [item.key]: !val })
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold cursor-pointer transition-all ${
                    val
                      ? 'bg-emerald-500 text-white shadow'
                      : 'bg-zinc-700 text-zinc-300'
                  }`}
                >
                  {val ? 'ON' : 'OFF'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
