import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom' // Thêm useNavigate để chuyển hướng khi cần
import { Menu, X, Bell, ChevronDown, User, LogOut, Car, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/api/notificationApi'
import clsx from 'clsx'

export default function Navbar() {
  const { user, isLoggedIn, isHost, isAdmin, logout } = useAuth()
  const [menuOpen, setMenuOpen]     = useState(false)
  const [dropdownOpen, setDropdown] = useState(false)
  const [notiOpen, setNotiOpen]     = useState(false)
  const [selectedNoti, setSelectedNoti] = useState(null) // State quản lý thông báo đang xem chi tiết
  
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const isActive = (path) => location.pathname === path

  // Fetch số lượng thông báo chưa đọc
  const { data: countRes } = useQuery({
    queryKey: ['noti-count'],
    queryFn: notificationApi.getUnreadCount,
    enabled: isLoggedIn,
    refetchInterval: 30000 // Tự động làm mới mỗi 30 giây
  })
  const unreadCount = countRes?.data?.data || 0

  // Fetch danh sách thông báo khi hộp thông báo mở
  const { data: notiRes } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getMine({ page: 0, size: 10 }),
    enabled: notiOpen && isLoggedIn
  })
  const notifications = notiRes?.data?.data?.content || []

  // Đánh dấu một thông báo là đã đọc
  const readMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['noti-count'])
      queryClient.invalidateQueries(['notifications'])
    }
  })

  // Đánh dấu tất cả thông báo là đã đọc
  const readAllMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['noti-count'])
      queryClient.invalidateQueries(['notifications'])
    }
  })

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
              <div className="relative">
                <button 
                  onClick={() => { setNotiOpen(!notiOpen); setDropdown(false); }}
                  className="relative p-2 rounded-lg hover:bg-surface-soft transition-colors"
                >
                  <Bell className="w-5 h-5 text-primary-muted" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center 
                                     rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-surface">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notiOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setNotiOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border
                                    rounded-xl shadow-modal z-20 overflow-hidden animate-fade-in">
                      <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-surface-soft">
                        <h3 className="text-sm font-bold text-primary">Thông báo</h3>
                        <button 
                          onClick={() => readAllMutation.mutate()}
                          disabled={readAllMutation.isPending || unreadCount === 0}
                          className="text-xs text-teal-600 font-medium hover:underline disabled:opacity-40 disabled:no-underline"
                        >
                          {readAllMutation.isPending ? 'Đang xử lý...' : 'Đánh dấu đọc tất cả'}
                        </button>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((noti) => (
                            <div 
                              key={noti.id} 
                              onClick={() => {
                                if (!noti.isRead) readMutation.mutate(noti.id)
                                setNotiOpen(false)
                                setSelectedNoti(noti) // Lưu thông báo vào state để mở Modal chi tiết ở giữa màn hình
                              }}
                              className={clsx(
                                'p-4 border-b border-border hover:bg-surface-soft cursor-pointer transition-colors',
                                !noti.isRead && 'bg-teal-50/30'
                              )}
                            >
                              <p className={clsx(
                                'text-sm mb-1 truncate',
                                !noti.isRead ? 'font-bold text-primary' : 'font-medium text-primary-muted'
                              )}>
                                {noti.title}
                              </p>
                              <p className="text-xs text-primary-subtle line-clamp-2">{noti.message}</p>
                              <p className="text-[10px] text-primary-subtle mt-2">
                                {new Date(noti.createdAt).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-sm text-primary-subtle">
                            Không có thông báo nào.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setDropdown(!dropdownOpen); setNotiOpen(false); }}
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

      {/* ✅ MODAL CHI TIẾT THÔNG BÁO (ĐÃ FIX: HIỆN CHUẨN GIỮA MÀN HÌNH) */}
      {selectedNoti && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          
          {/* Lớp nền trong suốt phía sau - click ra ngoài tự đóng modal */}
          <div className="absolute inset-0" onClick={() => setSelectedNoti(null)} />
          
          {/* Hộp nội dung chính - Giữa màn hình */}
          <div className="bg-surface border border-border rounded-2xl shadow-modal w-full max-w-md p-6 animate-slide-up relative z-10">
            
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="font-bold text-primary text-base leading-snug">
                {selectedNoti.title}
              </h3>
              <button 
                onClick={() => setSelectedNoti(null)}
                className="p-1 rounded-lg hover:bg-surface-soft transition-colors shrink-0"
              >
                <X className="w-5 h-5 text-primary-muted" />
              </button>
            </div>
            
            {/* Body Modal */}
            <div className="text-sm text-primary-muted leading-relaxed whitespace-pre-line mb-6 bg-surface-soft p-4 rounded-xl border border-border">
              {selectedNoti.message}
            </div>
            
            {/* Footer Modal */}
            <div className="flex items-center justify-between text-xs text-primary-subtle border-t border-border pt-4">
              <span>{new Date(selectedNoti.createdAt).toLocaleString('vi-VN')}</span>
              <div className="flex gap-2">
                {selectedNoti.referenceId && (
                  <button
                    onClick={() => {
                      setSelectedNoti(null);
                      navigate(`/bookings/${selectedNoti.referenceId}`);
                    }}
                    className="btn-primary px-3 py-1.5 text-xs font-semibold"
                  >
                    Xem đơn hàng
                  </button>
                )}
                <button
                  onClick={() => setSelectedNoti(null)}
                  className="btn-secondary px-3 py-1.5 text-xs font-semibold"
                >
                  Đóng
                </button>
              </div>
            </div>

          </div>
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