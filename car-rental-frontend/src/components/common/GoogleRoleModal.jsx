import { useState } from 'react'
import { Car, Home, X, Loader2 } from 'lucide-react'

/**
 * GoogleRoleModal
 * Hiển thị khi user mới đăng nhập bằng Google lần đầu — cần chọn role.
 *
 * Props:
 *  - isOpen: boolean
 *  - onSelect(role: 'CUSTOMER' | 'HOST'): callback khi user chọn xong
 *  - onClose(): đóng modal (huỷ)
 *  - loading: boolean
 */
export default function GoogleRoleModal({ isOpen, onSelect, onClose, loading }) {
  const [selected, setSelected] = useState(null)

  if (!isOpen) return null

  const roles = [
    {
      value: 'CUSTOMER',
      icon: Car,
      title: 'Thuê xe',
      desc: 'Tôi muốn tìm và thuê xe từ các chủ xe',
      color: 'teal',
      gradient: 'from-teal-500 to-emerald-500',
      bg: 'bg-teal-50 border-teal-200',
      bgSelected: 'bg-teal-600 border-teal-600',
    },
    {
      value: 'HOST',
      icon: Home,
      title: 'Cho thuê xe',
      desc: 'Tôi muốn đăng xe và kiếm thêm thu nhập',
      color: 'indigo',
      gradient: 'from-indigo-500 to-purple-500',
      bg: 'bg-indigo-50 border-indigo-200',
      bgSelected: 'bg-indigo-600 border-indigo-600',
    },
  ]

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

      {/* Modal card */}
      <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-primary-subtle
                     hover:text-primary hover:bg-surface-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          {/* Google icon */}
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white shadow-card
                          flex items-center justify-center border border-border">
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-primary">Bạn muốn làm gì?</h2>
          <p className="text-primary-subtle text-sm mt-1">
            Chọn vai trò để hoàn tất đăng ký tài khoản Google
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {roles.map(({ value, icon: Icon, title, desc, gradient, bg, bgSelected }) => {
            const isSelected = selected === value
            return (
              <button
                key={value}
                onClick={() => setSelected(value)}
                disabled={loading}
                className={`
                  relative p-4 rounded-xl border-2 text-left transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${isSelected
                    ? 'border-transparent text-white shadow-lg scale-[1.02]'
                    : 'border-border bg-surface hover:border-primary/30 hover:shadow-card text-primary'
                  }
                `}
              >
                {/* Gradient background khi selected */}
                {isSelected && (
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient} opacity-100`} />
                )}

                <div className="relative">
                  <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center
                                  ${isSelected ? 'bg-white/20' : `${bg.split(' ')[0]}`}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : ''}`} />
                  </div>
                  <div className="font-semibold text-sm">{title}</div>
                  <div className={`text-xs mt-0.5 leading-snug
                                  ${isSelected ? 'text-white/80' : 'text-primary-subtle'}`}>
                    {desc}
                  </div>
                </div>

                {/* Check badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-white/30 rounded-full
                                  flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Confirm button */}
        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected || loading}
          className={`
            w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200
            flex items-center justify-center gap-2
            ${selected && !loading
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.01]'
              : 'bg-surface-muted text-primary-subtle cursor-not-allowed'
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tạo tài khoản...
            </>
          ) : (
            selected ? `Tiếp tục với vai trò "${selected === 'CUSTOMER' ? 'Thuê xe' : 'Cho thuê xe'}"` : 'Chọn một vai trò'
          )}
        </button>

        <p className="text-center text-xs text-primary-subtle mt-3">
          Bạn có thể thay đổi vai trò sau trong phần cài đặt tài khoản
        </p>
      </div>
    </div>
  )
}
