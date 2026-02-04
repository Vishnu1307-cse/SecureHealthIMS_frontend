/**
 * Notification Service — mock in-memory notifications for admin dashboard.
 * When backend is ready, swap to real-time WebSocket / polling endpoints.
 */

export interface Notification {
  id: string
  type: 'doctor_request' | 'nurse_request' | 'system' | 'appointment' | 'info'
  title: string
  message: string
  read: boolean
  created_at: string
}

/* ─── Mock store ─── */
const notifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'doctor_request',
    title: 'New Doctor Request',
    message: 'Dr. David Lee has requested to join as a Doctor.',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
  },
  {
    id: 'notif-2',
    type: 'doctor_request',
    title: 'New Doctor Request',
    message: 'Dr. Priya Sharma has requested to join as a Doctor.',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hr ago
  },
  {
    id: 'notif-3',
    type: 'nurse_request',
    title: 'New Nurse Request',
    message: 'Lisa Brown has requested to join as a Nurse.',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hrs ago
  },
  {
    id: 'notif-4',
    type: 'appointment',
    title: 'Appointment Reminder',
    message: 'John Doe has an appointment with Dr. Wilson tomorrow at 09:00.',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hrs ago
  },
  {
    id: 'notif-5',
    type: 'system',
    title: 'System Update',
    message: 'System maintenance scheduled for Sunday 2:00 AM.',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
]

let notifCounter = 10

const delay = (ms = 150) => new Promise(r => setTimeout(r, ms))

/* ─── Fetch all notifications ─── */
export const fetchNotifications = async (): Promise<Notification[]> => {
  await delay()
  return [...notifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

/* ─── Unread count ─── */
export const getUnreadCount = async (): Promise<number> => {
  await delay(50)
  return notifications.filter(n => !n.read).length
}

/* ─── Mark one as read ─── */
export const markAsRead = async (id: string): Promise<void> => {
  await delay(50)
  const n = notifications.find(n => n.id === id)
  if (n) n.read = true
}

/* ─── Mark all as read ─── */
export const markAllAsRead = async (): Promise<void> => {
  await delay(50)
  notifications.forEach(n => (n.read = true))
}

/* ─── Add a notification (called when doctor/nurse requests login) ─── */
export const addNotification = (type: Notification['type'], title: string, message: string): void => {
  notifications.unshift({
    id: `notif-${++notifCounter}`,
    type,
    title,
    message,
    read: false,
    created_at: new Date().toISOString(),
  })
}

/* ─── Helper: format relative time ─── */
export const formatTimeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
