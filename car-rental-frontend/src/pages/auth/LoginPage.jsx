import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api/authApi'
import useAuthStore from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useQueryClient } from '@tanstack/react-query'

const schema = z.object({
  email:    z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
})

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const setAuth    = useAuthStore((s) => s.setAuth)
  const navigate   = useNavigate()
  const location   = useLocation()
  const from       = location.state?.from?.pathname || '/'

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const queryClient = useQueryClient()
  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await authApi.login(data)
      const { accessToken, refreshToken, user } = res.data.data
      setAuth({ user, accessToken, refreshToken })
      toast.success(`Chào mừng, ${user.fullName}!`)
      // Redirect theo role
      if (user.role === 'ADMIN')    navigate('/admin',  { replace: true })
      else if (user.role === 'HOST') navigate('/host',   { replace: true })
      else                          navigate(from,       { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại')
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
          <p className="text-primary-subtle text-sm mt-2">Đăng nhập vào tài khoản</p>
        </div>

        <div className="card p-6 animate-slide-up">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="example@email.com"
                className="input-base"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-base pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-subtle
                             hover:text-primary transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-teal-600 hover:text-teal-800 transition-colors">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <LoadingSpinner size="sm" /> : null}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="text-center text-sm text-primary-subtle mt-5">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-teal-600 font-semibold hover:text-teal-800">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}