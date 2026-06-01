import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '@/api/authApi'
import useAuthStore from '@/store/authStore'

/**
 * useGoogleAuth
 * Hook xử lý toàn bộ flow Google OAuth2:
 *  1. Nhận idToken từ GoogleLoginButton
 *  2. Gọi backend → nếu user mới thì hiện modal chọn role
 *  3. Gọi lại backend với role → đăng nhập thành công
 *
 * Usage:
 *   const { handleGoogleSuccess, handleRoleSelect, showRoleModal, setShowRoleModal, googleLoading } = useGoogleAuth()
 */
export function useGoogleAuth() {
  const [showRoleModal, setShowRoleModal]   = useState(false)
  const [pendingToken,  setPendingToken]    = useState(null)
  const [googleLoading, setGoogleLoading]  = useState(false)

  const setAuth    = useAuthStore((s) => s.setAuth)
  const navigate   = useNavigate()
  const location   = useLocation()
  const from       = location.state?.from?.pathname || '/'

  // Helper: lưu auth state và redirect
  const finalizeLogin = (loginData) => {
    const { accessToken, refreshToken, user } = loginData
    setAuth({ user, accessToken, refreshToken })
    toast.success(`Chào mừng, ${user.fullName}!`)
    if (user.role === 'ADMIN')     navigate('/admin', { replace: true })
    else if (user.role === 'HOST') navigate('/host',  { replace: true })
    else                           navigate(from,      { replace: true })
  }

  // Bước 1: Nhận idToken từ Google popup
  const handleGoogleSuccess = async (idToken) => {
    setGoogleLoading(true)
    try {
      const res  = await authApi.googleLogin(idToken)
      const data = res.data.data                      // GoogleAuthResponse

      if (data.needsRoleSelection) {
        // User mới — hiện modal chọn role, giữ idToken lại
        setPendingToken(idToken)
        setShowRoleModal(true)
      } else {
        // User cũ — đăng nhập thẳng
        finalizeLogin(data.loginData)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập Google thất bại')
    } finally {
      setGoogleLoading(false)
    }
  }

  // Bước 2: User đã chọn role trong modal
  const handleRoleSelect = async (role) => {
    setGoogleLoading(true)
    try {
      const res  = await authApi.googleLogin(pendingToken, role)
      const data = res.data.data
      setShowRoleModal(false)
      finalizeLogin(data.loginData)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setGoogleLoading(false)
    }
  }

  return {
    handleGoogleSuccess,
    handleRoleSelect,
    showRoleModal,
    setShowRoleModal,
    googleLoading,
  }
}
