import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Bell, ChevronDown, User, LogOut, Car, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import clsx from 'clsx'

export default function Navbar() {
  const { user, isLoggedIn, isHost, isAdmin, logout } = useAuth()
  const [menuOpen, setMenuOpen]     = useState(false)
  const [dropdownOpen, setDropdown] = useState(false)
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-1 shrink-0">
          <span className="text-xl font-bold tracking-tight text-primary">
            xe<span className="text-teal-600">go</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link
            to="/cars"
            className={clsx(
              'font-medium transition-colors',
              isActive('/cars') ? 'text-primary' : 'text-primary-muted hover:text-primary'
            )}
          >
            Tìm xe
          </Link>

          {isHost && (
            <Link
              to="/host"
              className={clsx(
                'font-medium transition-colors',
                location.pathname.startsWith('/host')
                  ? 'text-primary'
                  : 'text-primary-muted hover:text-primary'
              )}
            >
              Quản lý xe
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className={clsx(
                'font-medium transition-colors',
                location.pathname.startsWith('/admin')
                  ? 'text-primary'
                  : 'text-primary-muted hover:text-primary'
              )}
            >
              Admin
            </Link>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* Notification bell */}
              <button className="relative p-2 rounded-lg hover:bg-surface-soft transition-colors">
                <Bell className="w-5 h-5 text-primary-muted" />
              </button>

              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdown(!dropdownOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl
                             hover:bg-surface-soft transition-colors"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-8 h-8 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100
                                    flex items-center justify-center text-teal-600 text-sm font-bold">
                      {user?.fullName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-primary max-w-[120px] truncate">
                    {user?.fullName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-primary-subtle" />
                </button>

                {dropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdown(false)}
                    />
                    {/* Dropdown menu */}
                    <div className="absolute right-0 top-full mt-2 w-52 bg-surface border border-border
                                    rounded-xl shadow-modal z-20 overflow-hidden animate-fade-in">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold text-primary truncate">{user?.fullName}</p>
                        <p className="text-xs text-primary-subtle truncate">{user?.email}</p>
                      </div>

                      <div className="py-1">
                        <DropdownLink
                          to="/profile"
                          icon={<User className="w-4 h-4" />}
                          label="Hồ sơ cá nhân"
                          onClick={() => setDropdown(false)}
                        />

                        {isHost && (
                          <DropdownLink
                            to="/host"
                            icon={<Car className="w-4 h-4" />}
                            label="Quản lý xe"
                            onClick={() => setDropdown(false)}
                          />
                        )}

                        {isAdmin && (
                          <DropdownLink
                            to="/admin"
                            icon={<LayoutDashboard className="w-4 h-4" />}
                            label="Admin dashboard"
                            onClick={() => setDropdown(false)}
                          />
                        )}
                      </div>

                      <div className="border-t border-border py-1">
                        <button
                          onClick={() => { setDropdown(false); logout() }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                                     text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:block text-sm font-medium text-primary-muted
                           hover:text-primary transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="btn-primary text-sm px-4 py-2"
              >
                Đăng ký
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-surface-soft transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen
              ? <X className="w-5 h-5" />
              : <Menu className="w-5 h-5" />
            }
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-3 space-y-1 animate-slide-up">
          <MobileLink to="/cars"   label="Tìm xe"    onClick={() => setMenuOpen(false)} />
          {isHost  && <MobileLink to="/host"  label="Quản lý xe" onClick={() => setMenuOpen(false)} />}
          {isAdmin && <MobileLink to="/admin" label="Admin"      onClick={() => setMenuOpen(false)} />}
          {!isLoggedIn && (
            <>
              <MobileLink to="/login"    label="Đăng nhập" onClick={() => setMenuOpen(false)} />
              <MobileLink to="/register" label="Đăng ký"   onClick={() => setMenuOpen(false)} />
            </>
          )}
        </div>
      )}
    </nav>
  )
}

function DropdownLink({ to, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary
                 hover:bg-surface-soft transition-colors"
    >
      <span className="text-primary-muted">{icon}</span>
      {label}
    </Link>
  )
}

function MobileLink({ to, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-3 py-2.5 rounded-lg text-sm font-medium text-primary
                 hover:bg-surface-soft transition-colors"
    >
      {label}
    </Link>
  )
}