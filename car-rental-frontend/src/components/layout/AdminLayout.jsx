import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Car, Users, FileText,
  Menu, X, LogOut, ChevronRight, Shield,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const menuItems = [
  { path: '/admin',          icon: LayoutDashboard, label: 'Dashboard',       exact: true },
  { path: '/admin/cars',     icon: Car,             label: 'Quản lý xe' },
  { path: '/admin/users',    icon: Users,           label: 'Người dùng' },
  { path: '/admin/bookings', icon: FileText,         label: 'Đơn đặt xe' },
]

export default function AdminLayout({ children }) {
  const location   = useLocation()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const isActive = (item) =>
    item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path)

  return (
    <div className="min-h-screen flex bg-surface-soft">

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-60 bg-primary flex flex-col
        transition-transform duration-300
        md:relative md:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-14 flex items-center gap-2 px-5 border-b border-white/10">
          <Shield className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-white font-bold tracking-tight text-lg">
            xe<span className="text-teal-400">go</span>
            <span className="text-white/40 text-xs font-normal ml-1">admin</span>
          </span>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto md:hidden text-white/50 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon   = item.icon
            const active = isActive(item)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                             text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {item.label}
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
              </Link>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-teal-400/20 border border-teal-400/30
                            flex items-center justify-center text-teal-400 text-sm font-bold shrink-0">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.fullName}</p>
              <p className="text-white/40 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                       text-white/50 hover:text-white hover:bg-white/5
                       transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Main ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-surface border-b border-border flex items-center
                           gap-4 px-4 md:px-6 sticky top-0 z-30">
          <button
            onClick={() => setOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-soft text-primary-muted
                       hover:text-primary transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-primary-subtle">
            <Shield className="w-4 h-4 text-teal-600" />
            <span className="text-teal-600 font-semibold">Admin</span>
            {location.pathname !== '/admin' && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-primary font-medium">
                  {menuItems.find(m => !m.exact && location.pathname.startsWith(m.path))?.label || ''}
                </span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs text-primary-subtle
                            bg-surface-soft border border-border px-3 py-1.5 rounded-lg">
              <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
              Hệ thống hoạt động bình thường
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}