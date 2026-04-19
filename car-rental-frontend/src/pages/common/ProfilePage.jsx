import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Eye, EyeOff, Loader, LogOut, User, Mail, Phone, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { userApi } from '@/api/userApi'
import { authApi } from '@/api/authApi'
import { useAuth } from '@/hooks/useAuth'
import MainLayout from '@/components/layout/MainLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Tên phải tối thiểu 2 ký tự'),
  phone: z.string().regex(/^0\d{9}$/, 'SĐT phải là 10 số bắt đầu bằng 0').optional().or(z.literal('')),
  address: z.string().max(300, 'Địa chỉ tối đa 300 ký tự').optional().or(z.literal('')),
})

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải tối thiểu 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp',
    path: ['confirmPassword'],
  })

export default function ProfilePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl)

  // Fetch full profile data
  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile(),
  })

  const profile = profileRes?.data?.data

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
    watch: watchProfile,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      address: '',
    },
  })

  // Update profile
  useEffect(() => {
    if (profile) {
      resetProfile({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        address: profile.address || '',
      })
      setAvatarPreview(profile.avatarUrl)
    }
  }, [profile, resetProfile])

  // Change password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
  })

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data) => userApi.updateProfile(data),
    onSuccess: () => {
      toast.success('Cập nhật thông tin thành công')
      queryClient.invalidateQueries(['profile'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại')
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: (file) => userApi.uploadAvatar(file),
    onSuccess: () => {
      toast.success('Tải ảnh đại diện thành công')
      setAvatarFile(null)
      queryClient.invalidateQueries(['profile'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Tải ảnh thất bại')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data) =>
      authApi.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công')
      resetPassword()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại')
    },
  })

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ảnh phải nhỏ hơn 5MB')
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadAvatar = () => {
    if (!avatarFile) {
      toast.error('Chưa chọn ảnh')
      return
    }
    uploadAvatarMutation.mutate(avatarFile)
  }

  const onProfileSubmit = (data) => {
    updateProfileMutation.mutate(data)
  }

  const onPasswordSubmit = (data) => {
    changePasswordMutation.mutate(data)
  }

  const handleLogout = async () => {
    if (window.confirm('Bạn chắc chắn muốn đăng xuất?')) {
      await logout()
      navigate('/login', { replace: true })
    }
  }

  if (profileLoading) return <LoadingSpinner />

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Thông tin cá nhân</h1>
          <p className="text-primary-muted">Quản lý tài khoản và cài đặt bảo mật</p>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Avatar & User info */}
          <div className="lg:col-span-1">
            <div className="bg-surface border border-border rounded-2xl p-6 sticky top-8">
              {/* Avatar */}
              <div className="mb-6">
                <div className="w-full aspect-square bg-surface-soft rounded-2xl overflow-hidden mb-4
                              flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={profile?.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-primary-muted" />
                  )}
                </div>

                {/* Upload avatar */}
                <label className="flex items-center justify-center gap-2 px-4 py-2 border-2
                               border-dashed border-border rounded-lg cursor-pointer
                               hover:bg-surface-soft transition-colors">
                  <Upload className="w-4 h-4 text-primary-subtle" />
                  <span className="text-xs font-medium text-primary-muted">Chọn ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                </label>

                {avatarFile && (
                  <button
                    onClick={handleUploadAvatar}
                    disabled={uploadAvatarMutation.isPending}
                    className="w-full mt-2 bg-teal-600 text-white px-3 py-2 rounded-lg
                               text-xs font-semibold hover:bg-teal-700 transition-colors
                               disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {uploadAvatarMutation.isPending ? (
                      <>
                        <Loader className="w-3 h-3 animate-spin" />
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3" />
                        Tải lên
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* User info */}
              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                <div>
                  <p className="text-xs text-primary-subtle mb-1">Tên đăng nhập</p>
                  <p className="font-semibold text-primary truncate">{profile?.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-subtle mb-1">Email</p>
                  <p className="font-semibold text-primary text-sm truncate">{profile?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-subtle mb-1">Vai trò</p>
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    profile?.role === 'HOST'
                      ? 'bg-purple-50 text-purple-600'
                      : 'bg-blue-50 text-blue-600'
                  }`}>
                    {profile?.role === 'HOST' ? '🏠 Host' : '👤 Khách hàng'}
                  </span>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                           text-red-600 bg-red-50 border border-red-200 rounded-lg
                           text-sm font-semibold hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>

          {/* Right: Forms */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-border">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'profile'
                    ? 'text-primary border-teal-600'
                    : 'text-primary-muted border-transparent hover:text-primary'
                }`}
              >
                Thông tin cá nhân
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'password'
                    ? 'text-primary border-teal-600'
                    : 'text-primary-muted border-transparent hover:text-primary'
                }`}
              >
                Đổi mật khẩu
              </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                <div className="bg-surface border border-border rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-primary mb-4">Thông tin cơ bản</h2>

                  <div className="space-y-4">
                    {/* Tên đầy đủ */}
                    <div>
                      <label className="block text-xs font-semibold text-primary-subtle uppercase
                                     tracking-wider mb-1.5">
                        Tên đầy đủ
                      </label>
                      <input
                        {...registerProfile('fullName')}
                        placeholder="Nguyễn Văn A"
                        className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                                 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                                 focus:border-teal-400 transition-all"
                      />
                      {profileErrors.fullName && (
                        <p className="text-red-500 text-xs mt-1">
                          {profileErrors.fullName.message}
                        </p>
                      )}
                    </div>

                    {/* Email (readonly) */}
                    <div>
                      <label className="block text-xs font-semibold text-primary-subtle uppercase
                                     tracking-wider mb-1.5">
                        Email (không thể thay đổi)
                      </label>
                      <input
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="w-full bg-surface-muted border border-border rounded-lg px-4 py-2.5
                                 text-sm text-primary-muted cursor-not-allowed opacity-60"
                      />
                    </div>

                    {/* Số điện thoại */}
                    <div>
                      <label className="block text-xs font-semibold text-primary-subtle uppercase
                                     tracking-wider mb-1.5">
                        Số điện thoại
                      </label>
                      <input
                        {...registerProfile('phone')}
                        placeholder="0912345678"
                        className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                                 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                                 focus:border-teal-400 transition-all"
                      />
                      {profileErrors.phone && (
                        <p className="text-red-500 text-xs mt-1">
                          {profileErrors.phone.message}
                        </p>
                      )}
                    </div>

                    {/* Địa chỉ */}
                    <div>
                      <label className="block text-xs font-semibold text-primary-subtle uppercase
                                     tracking-wider mb-1.5">
                        Địa chỉ
                      </label>
                      <input
                        {...registerProfile('address')}
                        placeholder="123 Đường ABC, Quận 1, TP. HCM"
                        className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                                 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                                 focus:border-teal-400 transition-all"
                      />
                      {profileErrors.address && (
                        <p className="text-red-500 text-xs mt-1">
                          {profileErrors.address.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 bg-primary text-white px-6 py-3 rounded-xl text-sm
                               font-semibold hover:bg-primary-soft transition-colors disabled:opacity-50
                               flex items-center justify-center gap-2"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu thay đổi'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetProfile()}
                    className="flex-1 bg-surface-soft border border-border text-primary px-6 py-3
                               rounded-xl text-sm font-semibold hover:bg-surface-muted transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                <div className="bg-surface border border-border rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-primary mb-4">Đổi mật khẩu</h2>

                  <div className="space-y-4">
                    {/* Current password */}
                    <div>
                      <label className="block text-xs font-semibold text-primary-subtle uppercase
                                     tracking-wider mb-1.5">
                        Mật khẩu hiện tại
                      </label>
                      <div className="relative">
                        <input
                          {...registerPassword('currentPassword')}
                          type={showCurrentPass ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                                   text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                                   focus:border-teal-400 transition-all pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-subtle
                                   hover:text-primary transition-colors"
                        >
                          {showCurrentPass ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="text-red-500 text-xs mt-1">
                          {passwordErrors.currentPassword.message}
                        </p>
                      )}
                    </div>

                    {/* New password */}
                    <div>
                      <label className="block text-xs font-semibold text-primary-subtle uppercase
                                     tracking-wider mb-1.5">
                        Mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          {...registerPassword('newPassword')}
                          type={showNewPass ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                                   text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                                   focus:border-teal-400 transition-all pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-subtle
                                   hover:text-primary transition-colors"
                        >
                          {showNewPass ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="text-red-500 text-xs mt-1">
                          {passwordErrors.newPassword.message}
                        </p>
                      )}
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label className="block text-xs font-semibold text-primary-subtle uppercase
                                     tracking-wider mb-1.5">
                        Xác nhận mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          {...registerPassword('confirmPassword')}
                          type={showConfirmPass ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                                   text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                                   focus:border-teal-400 transition-all pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-subtle
                                   hover:text-primary transition-colors"
                        >
                          {showConfirmPass ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">
                          {passwordErrors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Info box */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-xs text-blue-700 leading-relaxed">
                      💡 <span className="font-medium">Lưu ý:</span> Mật khẩu mới phải khác mật khẩu cũ
                      và tối thiểu 6 ký tự.
                    </p>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="flex-1 bg-primary text-white px-6 py-3 rounded-xl text-sm
                               font-semibold hover:bg-primary-soft transition-colors disabled:opacity-50
                               flex items-center justify-center gap-2"
                  >
                    {changePasswordMutation.isPending ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      'Đổi mật khẩu'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetPassword()}
                    className="flex-1 bg-surface-soft border border-border text-primary px-6 py-3
                               rounded-xl text-sm font-semibold hover:bg-surface-muted transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
