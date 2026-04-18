import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api/authApi'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const schema = z.object({
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  email:    z.string().email('Email không hợp lệ'),
  phone:    z.string().regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không hợp lệ'),
  password: z.string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .regex(/[A-Z]/, 'Cần ít nhất 1 chữ hoa')
    .regex(/\d/,   'Cần ít nhất 1 số'),
  role: z.enum(['CUSTOMER', 'HOST'], { required_error: 'Vui lòng chọn vai trò' }),
})

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const navigate = useNavigate()

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'CUSTOMER' },
  })
  const selectedRole = watch('role')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authApi.register(data)
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-soft flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold tracking-tight">
            xe<span className="text-teal-600">go</span>
          </Link>
          <p className="text-primary-subtle text-sm mt-2">Tạo tài khoản mới</p>
        </div>

        <div className="card p-6 animate-slide-up">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Role selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-muted rounded-xl">
              {[['CUSTOMER', 'Thuê xe'], ['HOST', 'Cho thuê xe']].map(([val, label]) => (
                <label
                  key={val}
                  className={`flex items-center justify-center py-2 rounded-lg cursor-pointer
                              text-sm font-semibold transition-all ${
                    selectedRole === val
                      ? 'bg-surface shadow-card text-primary'
                      : 'text-primary-subtle hover:text-primary'
                  }`}
                >
                  <input {...register('role')} type="radio" value={val} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
            {errors.role && <p className="text-red-500 text-xs">{errors.role.message}</p>}

            {/* Full name */}
            <div>
              <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                Họ và tên
              </label>
              <input {...register('fullName')} placeholder="Nguyễn Văn A" className="input-base" />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input {...register('email')} type="email" placeholder="example@email.com" className="input-base" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                Số điện thoại
              </label>
              <input {...register('phone')} placeholder="0901234567" className="input-base" />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
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
                  placeholder="Tối thiểu 8 ký tự, 1 chữ hoa, 1 số"
                  className="input-base pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-subtle hover:text-primary">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <LoadingSpinner size="sm" />}
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <p className="text-center text-sm text-primary-subtle mt-5">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-teal-600 font-semibold hover:text-teal-800">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  )
}