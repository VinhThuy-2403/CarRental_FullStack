import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Upload, Eye, EyeOff, Loader, LogOut, User,
  Car, Clock, CheckCircle, XCircle, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { userApi } from '@/api/userApi'
import { authApi } from '@/api/authApi'
import { bookingApi } from '@/api/bookingApi'
import { useAuth } from '@/hooks/useAuth'
import MainLayout from '@/components/layout/MainLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  fullName: z.string().min(2, 'Tên phải tối thiểu 2 ký tự'),
  phone: z
    .string()
    .regex(/^0\d{9}$/, 'SĐT phải là 10 số bắt đầu bằng 0')
    .optional()
    .or(z.literal('')),
  address: z.string().max(300, 'Địa chỉ tối đa 300 ký tự').optional().or(z.literal('')),
})

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải tối thiểu 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp',
    path: ['confirmPassword'],
  })

// ─── Booking status config ────────────────────────────────────────────────────

const BOOKING_STATUS = {
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  PENDING_CONFIRM: {
    label: 'Chờ xác nhận',
    color: 'bg-teal-50 text-teal-600 border-teal-100',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    color: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  IN_PROGRESS: {
    label: 'Đang thuê',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    color: 'bg-green-50 text-green-700 border-green-200',
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: 'bg-gray-100 text-gray-500 border-gray-200',
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    color: 'bg-purple-50 text-purple-600 border-purple-200',
  },
}

const labelCls =
  'block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5'
const inputCls = `w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-teal-400/25
                  focus:border-teal-400 transition-all`

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const { user, logout, updateUser } = useAuth()
  const isCustomer   = user?.role === 'CUSTOMER'

  const [activeTab, setActiveTab]       = useState('profile')
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass]   = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [avatarFile, setAvatarFile]     = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl)
  const [bookingPage, setBookingPage]   = useState(0)

  // ── Fetch profile ─────────────────────────────────────
  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn:  () => userApi.getProfile(),
  })
  const profile = profileRes?.data?.data

  // ── Fetch bookings (chỉ khi là Customer & tab bookings) ──
  const { data: bookingsRes, isLoading: bookingsLoading } = useQuery({
    queryKey: ['my-bookings-profile', bookingPage],
    queryFn:  () => bookingApi.getMyBookings({ page: bookingPage, size: 5 }),
    enabled:  isCustomer && activeTab === 'bookings',
  })
  const bookingsData  = bookingsRes?.data?.data
  const bookings      = bookingsData?.content || []
  const totalBookings = bookingsData?.totalElements || 0
  const totalPages    = bookingsData?.totalPages    || 0

  // Tính stats từ tất cả bookings
  const { data: allBookingsRes } = useQuery({
    queryKey: ['my-bookings-stats'],
    queryFn:  () => bookingApi.getMyBookings({ page: 0, size: 100 }),
    enabled:  isCustomer,
  })
  const allBookings   = allBookingsRes?.data?.data?.content || []
  const completedCount = allBookings.filter((b) => b.status === 'COMPLETED').length
  const activeCount    = allBookings.filter((b) =>
    ['PENDING_CONFIRM', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length

  // ── Profile form ──────────────────────────────────────
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', phone: '', address: '' },
  })

  useEffect(() => {
    if (profile) {
      resetProfile({
        fullName: profile.fullName || '',
        phone:    profile.phone    || '',
        address:  profile.address  || '',
      })
      setAvatarPreview(profile.avatarUrl)
    }
  }, [profile, resetProfile])

  // ── Password form ─────────────────────────────────────
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm({ resolver: zodResolver(changePasswordSchema) })

  // ── Mutations ─────────────────────────────────────────
  const updateProfileMutation = useMutation({
    mutationFn: (data) => userApi.updateProfile(data),
    onSuccess: (res) => { // Thêm (res) ở đây
      toast.success('Cập nhật thông tin thành công')
      updateUser(res.data.data) // Cập nhật TÊN/SĐT mới vào Navbar
      queryClient.invalidateQueries(['profile'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cập nhật thất bại'),
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: (file) => userApi.uploadAvatar(file),
    onSuccess: (res) => { // Thêm (res) ở đây
      toast.success('Tải ảnh đại diện thành công')
      setAvatarFile(null)
      updateUser(res.data.data) // Cập nhật ẢNH mới vào Navbar
      queryClient.invalidateQueries(['profile'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Tải ảnh thất bại'),
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data) => authApi.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công')
      resetPassword()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại'),
  })

  // ── Handlers ──────────────────────────────────────────
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh phải nhỏ hơn 5MB'); return }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result)
    reader.readAsDataURL(file)
  }

  const handleLogout = async () => {
    if (window.confirm('Bạn chắc chắn muốn đăng xuất?')) {
      await logout()
      navigate('/login', { replace: true })
    }
  }

  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString('vi-VN') : '--'

  if (profileLoading) return <LoadingSpinner />

  // ── Tabs config ───────────────────────────────────────
  const tabs = [
    { key: 'profile',  label: 'Thông tin cá nhân' },
    { key: 'password', label: 'Đổi mật khẩu' },
    ...(isCustomer ? [{ key: 'bookings', label: 'Lịch sử đặt xe' }] : []),
  ]

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-1">Thông tin cá nhân</h1>
          <p className="text-primary-muted text-sm">Quản lý tài khoản và cài đặt bảo mật</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Left: Avatar & Info ────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-surface border border-border rounded-2xl p-6 sticky top-8">

              {/* Avatar */}
              <div className="mb-5">
                <div className="w-full aspect-square bg-surface-soft rounded-2xl overflow-hidden
                                mb-3 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={profile?.fullName}
                         className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-primary-muted" />
                  )}
                </div>
                <label className="flex items-center justify-center gap-2 px-4 py-2 border-2
                                   border-dashed border-border rounded-lg cursor-pointer
                                   hover:bg-surface-soft transition-colors">
                  <Upload className="w-4 h-4 text-primary-subtle" />
                  <span className="text-xs font-medium text-primary-muted">Chọn ảnh</span>
                  <input type="file" accept="image/*"
                         onChange={handleAvatarSelect} className="hidden" />
                </label>
                {avatarFile && (
                  <button onClick={() => uploadAvatarMutation.mutate(avatarFile)}
                    disabled={uploadAvatarMutation.isPending}
                    className="w-full mt-2 bg-teal-600 text-white px-3 py-2 rounded-lg
                               text-xs font-semibold hover:bg-teal-700 transition-colors
                               disabled:opacity-50 flex items-center justify-center gap-1">
                    {uploadAvatarMutation.isPending
                      ? <><Loader className="w-3 h-3 animate-spin" />Đang tải...</>
                      : <><Upload className="w-3 h-3" />Tải lên</>}
                  </button>
                )}
              </div>

              {/* User info summary */}
              <div className="space-y-3 mb-5 pb-5 border-b border-border">
                <div>
                  <p className="text-xs text-primary-subtle mb-0.5">Tên</p>
                  <p className="font-semibold text-primary truncate text-sm">{profile?.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-subtle mb-0.5">Email</p>
                  <p className="font-medium text-primary text-xs truncate">{profile?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-subtle mb-0.5">Vai trò</p>
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    profile?.role === 'HOST'
                      ? 'bg-purple-50 text-purple-600'
                      : 'bg-blue-50 text-blue-600'
                  }`}>
                    {profile?.role === 'HOST' ? 'Host' : 'Khách hàng'}
                  </span>
                </div>
              </div>

              {/* Stats cho Customer */}
              {isCustomer && (
                <div className="grid grid-cols-2 gap-2 mb-5 pb-5 border-b border-border">
                  <div className="bg-surface-soft rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-primary">{completedCount}</p>
                    <p className="text-xs text-primary-subtle mt-0.5">Hoàn thành</p>
                  </div>
                  <div className="bg-surface-soft rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-teal-600">{activeCount}</p>
                    <p className="text-xs text-primary-subtle mt-0.5">Đang hoạt động</p>
                  </div>
                </div>
              )}

              {/* Logout */}
              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                           text-red-600 bg-red-50 border border-red-200 rounded-lg
                           text-sm font-semibold hover:bg-red-100 transition-colors">
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>

          {/* ── Right: Tabs & Content ──────────────────── */}
          <div className="lg:col-span-3">

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors
                               border-b-2 ${
                    activeTab === tab.key
                      ? 'text-primary border-teal-600'
                      : 'text-primary-muted border-transparent hover:text-primary'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab: Thông tin cá nhân ─────────────── */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit((data) => updateProfileMutation.mutate(data))}
                    className="space-y-6">
                <div className="bg-surface border border-border rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-primary mb-4">Thông tin cơ bản</h2>
                  <div className="space-y-4">

                    <div>
                      <label className={labelCls}>Tên đầy đủ</label>
                      <input {...registerProfile('fullName')} placeholder="Nguyễn Văn A"
                             className={inputCls} />
                      {profileErrors.fullName && (
                        <p className="text-red-500 text-xs mt-1">{profileErrors.fullName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className={labelCls}>Email (không thể thay đổi)</label>
                      <input type="email" value={profile?.email || ''} disabled
                             className={`${inputCls} opacity-60 cursor-not-allowed bg-surface-muted`} />
                    </div>

                    <div>
                      <label className={labelCls}>Số điện thoại</label>
                      <input {...registerProfile('phone')} placeholder="0912345678"
                             className={inputCls} />
                      {profileErrors.phone && (
                        <p className="text-red-500 text-xs mt-1">{profileErrors.phone.message}</p>
                      )}
                    </div>

                    <div>
                      <label className={labelCls}>Địa chỉ</label>
                      <input {...registerProfile('address')}
                             placeholder="123 Đường ABC, Quận 1, TP. HCM"
                             className={inputCls} />
                      {profileErrors.address && (
                        <p className="text-red-500 text-xs mt-1">{profileErrors.address.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="submit" disabled={updateProfileMutation.isPending}
                    className="flex-1 bg-primary text-white px-6 py-3 rounded-xl text-sm
                               font-semibold hover:bg-primary-soft transition-colors disabled:opacity-50
                               flex items-center justify-center gap-2">
                    {updateProfileMutation.isPending
                      ? <><Loader className="w-4 h-4 animate-spin" />Đang lưu...</>
                      : 'Lưu thay đổi'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetPassword()
                      navigate(-1)
                    }}
                    className="flex-1 bg-surface-soft border border-border text-primary px-6 py-3
                              rounded-xl text-sm font-semibold hover:bg-surface-muted transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            {/* ── Tab: Đổi mật khẩu ─────────────────── */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit((data) => changePasswordMutation.mutate(data))}
                    className="space-y-6">
                <div className="bg-surface border border-border rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-primary mb-4">Đổi mật khẩu</h2>
                  <div className="space-y-4">

                    {[
                      { field: 'currentPassword', label: 'Mật khẩu hiện tại', show: showCurrentPass, toggle: () => setShowCurrentPass(!showCurrentPass), error: passwordErrors.currentPassword },
                      { field: 'newPassword',     label: 'Mật khẩu mới',      show: showNewPass,     toggle: () => setShowNewPass(!showNewPass),         error: passwordErrors.newPassword },
                      { field: 'confirmPassword', label: 'Xác nhận mật khẩu mới', show: showConfirmPass, toggle: () => setShowConfirmPass(!showConfirmPass), error: passwordErrors.confirmPassword },
                    ].map((item) => (
                      <div key={item.field}>
                        <label className={labelCls}>{item.label}</label>
                        <div className="relative">
                          <input {...registerPassword(item.field)}
                            type={item.show ? 'text' : 'password'}
                            placeholder="••••••••"
                            className={`${inputCls} pr-10`} />
                          <button type="button" onClick={item.toggle}
                            className="absolute right-3 top-1/2 -translate-y-1/2
                                       text-primary-subtle hover:text-primary transition-colors">
                            {item.show
                              ? <EyeOff className="w-4 h-4" />
                              : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {item.error && (
                          <p className="text-red-500 text-xs mt-1">{item.error.message}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Mật khẩu mới phải tối thiểu 6 ký tự và khác mật khẩu cũ.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="submit" disabled={changePasswordMutation.isPending}
                    className="flex-1 bg-primary text-white px-6 py-3 rounded-xl text-sm
                               font-semibold hover:bg-primary-soft transition-colors disabled:opacity-50
                               flex items-center justify-center gap-2">
                    {changePasswordMutation.isPending
                      ? <><Loader className="w-4 h-4 animate-spin" />Đang lưu...</>
                      : 'Đổi mật khẩu'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetPassword()
                      navigate(-1)
                    }}
                    className="flex-1 bg-surface-soft border border-border text-primary px-6 py-3
                              rounded-xl text-sm font-semibold hover:bg-surface-muted transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            {/* ── Tab: Lịch sử đặt xe (Customer only) ── */}
            {activeTab === 'bookings' && isCustomer && (
              <div className="space-y-4 animate-fade-in">

                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    icon={<Car className="w-5 h-5 text-primary" />}
                    value={totalBookings}
                    label="Tổng số chuyến"
                    bg="bg-surface-soft"
                    valueColor="text-primary"
                  />
                  <StatCard
                    icon={<CheckCircle className="w-5 h-5 text-teal-600" />}
                    value={completedCount}
                    label="Hoàn thành"
                    bg="bg-teal-50"
                    valueColor="text-teal-700"
                  />
                  <StatCard
                    icon={<Clock className="w-5 h-5 text-blue-600" />}
                    value={activeCount}
                    label="Đang hoạt động"
                    bg="bg-blue-50"
                    valueColor="text-blue-700"
                  />
                </div>

                {/* Booking list */}
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-base font-bold text-primary">Lịch sử đặt xe</h2>
                    {totalBookings > 0 && (
                      <span className="text-xs text-primary-subtle">
                        {totalBookings} chuyến
                      </span>
                    )}
                  </div>

                  {bookingsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner />
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="py-16 text-center">
                      <Car className="w-12 h-12 text-primary-subtle mx-auto mb-3 opacity-40" />
                      <p className="text-primary-muted font-medium mb-1">Chưa có chuyến đặt xe nào</p>
                      <p className="text-primary-subtle text-sm mb-4">
                        Hãy tìm và đặt xe để bắt đầu hành trình của bạn
                      </p>
                      <button
                        onClick={() => navigate('/cars')}
                        className="btn-teal px-5 py-2 text-sm"
                      >
                        Tìm xe ngay
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {bookings.map((booking) => (
                        <BookingRow
                          key={booking.id}
                          booking={booking}
                          onClick={() => navigate(`/bookings/${booking.id}`)}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      disabled={bookingPage === 0}
                      onClick={() => setBookingPage((p) => p - 1)}
                      className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                    >
                      ← Trước
                    </button>
                    <span className="text-sm text-primary-subtle px-2">
                      Trang {bookingPage + 1} / {totalPages}
                    </span>
                    <button
                      disabled={bookingPage >= totalPages - 1}
                      onClick={() => setBookingPage((p) => p + 1)}
                      className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                    >
                      Tiếp →
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </MainLayout>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, value, label, bg, valueColor }) {
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-xs text-primary-subtle mt-0.5">{label}</p>
    </div>
  )
}

function BookingRow({ booking, onClick, formatDate }) {
  const statusCfg = BOOKING_STATUS[booking.status] || {
    label: booking.status,
    color: 'bg-gray-100 text-gray-500 border-gray-200',
  }

  // Icon theo trạng thái
  const StatusIcon = () => {
    if (['COMPLETED'].includes(booking.status))
      return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
    if (['CANCELLED', 'REFUNDED'].includes(booking.status))
      return <XCircle className="w-4 h-4 text-gray-400 shrink-0" />
    return <Clock className="w-4 h-4 text-teal-500 shrink-0" />
  }

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-5 py-4 hover:bg-surface-soft
                 transition-colors cursor-pointer group"
    >
      {/* Ảnh xe */}
      <div className="w-16 h-12 rounded-xl overflow-hidden bg-surface-muted shrink-0">
        {booking.carImageUrl ? (
          <img src={booking.carImageUrl} alt={booking.carName}
               className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-5 h-5 text-primary-subtle opacity-40" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <StatusIcon />
          <p className="text-sm font-bold text-primary truncate">
            {booking.carName || `Đơn #${booking.id}`}
          </p>
        </div>
        <p className="text-xs text-primary-subtle">
          {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
          {booking.totalDays && ` · ${booking.totalDays} ngày`}
        </p>
      </div>

      {/* Right: giá + badge + arrow */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
        {booking.totalPrice && (
          <p className="text-sm font-bold text-primary">
            {Number(booking.totalPrice).toLocaleString('vi-VN')}đ
          </p>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-primary-subtle group-hover:text-primary
                                transition-colors shrink-0" />
    </div>
  )
}