import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api/authApi'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Mật khẩu tối thiểu 8 ký tự')
      .regex(/[A-Z]/, 'Cần ít nhất 1 chữ hoa')
      .regex(/\d/, 'Cần ít nhất 1 số'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp',
    path: ['confirmPassword'],
  })

// Kiểm tra độ mạnh password realtime
function PasswordStrength({ password }) {
  if (!password) return null
  const checks = [
    { label: 'Tối thiểu 8 ký tự',   ok: password.length >= 8 },
    { label: 'Có chữ hoa (A-Z)',     ok: /[A-Z]/.test(password) },
    { label: 'Có số (0-9)',          ok: /\d/.test(password) },
  ]
  return (
    <div className="mt-2 space-y-1">
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-1.5">
          {c.ok
            ? <CheckCircle className="w-3 h-3 text-teal-500 shrink-0" />
            : <XCircle    className="w-3 h-3 text-primary-subtle shrink-0" />
          }
          <span className={`text-xs ${c.ok ? 'text-teal-600' : 'text-primary-subtle'}`}>
            {c.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ResetPasswordPage() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const token           = searchParams.get('token')

  const [loading, setLoading]   = useState(false)
  const [showNew, setShowNew]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess]   = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const newPasswordValue = watch('newPassword', '')

  // Không có token trong URL → hiện thông báo lỗi
  if (!token) {
    return (
      <div className="min-h-screen bg-surface-soft flex items-center justify-center p-4">
        <div className="w-full max-w-sm card p-8 text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-primary mb-2">Link không hợp lệ</h2>
          <p className="text-sm text-primary-muted mb-6">
            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
          </p>
          <Link to="/forgot-password" className="btn-primary inline-block px-6 py-2.5 text-sm">
            Yêu cầu link mới
          </Link>
        </div>
      </div>
    )
  }

  const onSubmit = async ({ newPassword }) => {
    setLoading(true)
    try {
      await authApi.resetPassword(token, newPassword)
      setSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.message || 'Đặt lại mật khẩu thất bại'
      toast.error(msg)
      // Nếu token hết hạn thì gợi ý yêu cầu lại
      if (msg.includes('hết hạn') || msg.includes('không hợp lệ')) {
        setTimeout(() => navigate('/forgot-password'), 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Thành công ───────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-surface-soft flex items-center justify-center p-4">
        <div className="w-full max-w-sm card p-8 text-center animate-slide-up">
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center
                          mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-xl font-bold text-primary mb-2">Đặt lại thành công!</h2>
          <p className="text-sm text-primary-muted leading-relaxed mb-6">
            Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập bằng mật khẩu mới.
          </p>
          <Link to="/login" className="btn-primary inline-block px-8 py-2.5 text-sm">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    )
  }

  // ── Form đặt lại mật khẩu ───────────────────────────
  return (
    <div className="min-h-screen bg-surface-soft flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold tracking-tight">
            xe<span className="text-teal-600">go</span>
          </Link>
          <p className="text-primary-subtle text-sm mt-2">Đặt lại mật khẩu</p>
        </div>

        <div className="card p-6 animate-slide-up">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-primary mb-1">Mật khẩu mới</h2>
            <p className="text-sm text-primary-muted">
              Nhập mật khẩu mới cho tài khoản của bạn.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Mật khẩu mới */}
            <div>
              <label className="block text-xs font-semibold text-primary-subtle
                                 uppercase tracking-wider mb-1.5">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  {...register('newPassword')}
                  type={showNew ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-base pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-primary-subtle hover:text-primary transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
              )}
              {/* Indicator độ mạnh */}
              <PasswordStrength password={newPasswordValue} />
            </div>

            {/* Xác nhận mật khẩu */}
            <div>
              <label className="block text-xs font-semibold text-primary-subtle
                                 uppercase tracking-wider mb-1.5">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-base pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-primary-subtle hover:text-primary transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              {loading ? <LoadingSpinner size="sm" /> : null}
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
          </form>

          <Link
            to="/login"
            className="block text-center text-sm text-primary-muted
                       hover:text-primary transition-colors mt-5"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}