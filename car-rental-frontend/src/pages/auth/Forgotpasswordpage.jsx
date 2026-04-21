import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api/authApi'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

export default function ForgotPasswordPage() {
  const [loading, setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email }) => {
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSentEmail(email)
      setSubmitted(true)
    } catch (err) {
      // Backend luôn trả 200 dù email không tồn tại (tránh email enumeration)
      // nên lỗi thật sự ở đây chỉ là lỗi mạng
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-soft flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold tracking-tight">
            xe<span className="text-teal-600">go</span>
          </Link>
        </div>

        {/* ── Sau khi gửi thành công ── */}
        {submitted ? (
          <div className="card p-8 text-center animate-slide-up">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center
                            mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">Kiểm tra email của bạn</h2>
            <p className="text-sm text-primary-muted leading-relaxed mb-2">
              Chúng tôi đã gửi link đặt lại mật khẩu đến
            </p>
            <p className="text-sm font-semibold text-primary mb-5">{sentEmail}</p>
            <p className="text-xs text-primary-subtle leading-relaxed mb-6">
              Link có hiệu lực trong <span className="font-semibold text-primary">15 phút</span>.
              Nếu không thấy, hãy kiểm tra thư mục Spam.
            </p>

            {/* Gửi lại */}
            <button
              onClick={() => setSubmitted(false)}
              className="text-sm text-teal-600 font-semibold hover:text-teal-800
                         transition-colors mb-4 block w-full"
            >
              Gửi lại email
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-primary-muted
                         hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          /* ── Form nhập email ── */
          <div className="card p-6 animate-slide-up">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-primary mb-1">Quên mật khẩu?</h2>
              <p className="text-sm text-primary-muted leading-relaxed">
                Nhập email đăng ký của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-primary-subtle
                                   uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2
                                   w-4 h-4 text-primary-subtle" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="example@email.com"
                    className="input-base pl-10"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
              >
                {loading ? <LoadingSpinner size="sm" /> : null}
                {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
              </button>
            </form>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-primary-muted
                         hover:text-primary transition-colors mt-5"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}