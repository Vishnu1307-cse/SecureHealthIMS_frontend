import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, Bell, UserPlus, Stethoscope, HeartPulse, Info, Calendar } from 'lucide-react'
import {
  fetchNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  formatTimeAgo,
  type Notification,
} from '../services/notificationService'

const typeIcon: Record<Notification['type'], React.ReactNode> = {
  doctor_request: <Stethoscope size={16} className="text-blue-400" />,
  nurse_request: <HeartPulse size={16} className="text-green-400" />,
  system: <Info size={16} className="text-amber-400" />,
  appointment: <Calendar size={16} className="text-purple-400" />,
  info: <Info size={16} className="text-cyan-400" />,
}

export const TopHeader = () => {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    user?.email?.split('@')[0] ||
    'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const role = profile?.role || (user?.user_metadata?.role as string) || ''

  /* ─── Notification state ─── */
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const bellRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })

  const load = async () => {
    const [list, count] = await Promise.all([fetchNotifications(), getUnreadCount()])
    setNotifications(list)
    setUnread(count)
  }

  useEffect(() => {
    if (role === 'admin') load()
    const interval = setInterval(() => { if (role === 'admin') load() }, 30_000)
    return () => clearInterval(interval)
  }, [role])

  // Position dropdown below bell icon
  const toggleOpen = useCallback(() => {
    if (!open && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
    setOpen(o => !o)
  }, [open])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        bellRef.current && !bellRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMarkRead = async (id: string) => {
    await markAsRead(id)
    await load()
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    await load()
  }

  const onLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  /* ─── Notification Dropdown (Portal) ─── */
  const notificationDropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-96 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
          style={{ top: dropdownPos.top, right: dropdownPos.right, zIndex: 99999 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-800/60 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-200">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications</p>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={`flex w-full items-start gap-3 border-b border-slate-800/50 px-4 py-3 text-left transition hover:bg-slate-800/40 ${
                    !n.read ? 'bg-slate-800/20' : ''
                  }`}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800">
                    {typeIcon[n.type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold ${!n.read ? 'text-white' : 'text-slate-400'}`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{formatTimeAgo(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-800 bg-slate-800/30 px-4 py-2 text-center">
              <button
                onClick={() => { setOpen(false); navigate('/admin/notifications') }}
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>,
        document.body,
      )
    : null

  return (
    <header className="flex items-center justify-between border-b border-slate-800/70 bg-slate-950/70 px-6 py-3 backdrop-blur">
      <div>
        <p className="text-base text-slate-300">
          Welcome, <span className="font-bold text-white">{displayName}</span>
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* ─── Notification Bell (admin only) ─── */}
        {role === 'admin' && (
          <>
            <button
              ref={bellRef}
              onClick={toggleOpen}
              className="relative rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {notificationDropdown}
          </>
        )}

        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/80 text-xs font-bold text-white">
          {initials}
        </span>
        <button onClick={onLogout} className="ghost-btn flex items-center gap-2 text-sm">
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </header>
  )
}
