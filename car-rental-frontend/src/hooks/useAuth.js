import useAuthStore from '@/store/authStore'
import { authApi } from '@/api/authApi'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
  const store = useAuthStore()
  const navigate = useNavigate()

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } catch {
      // ignore
    } finally {
      store.logout()
      toast.success('Đã đăng xuất')
      navigate('/login')
    }
  }

  return {
    user:       store.user,
    isLoggedIn: store.isLoggedIn,
    isCustomer: store.isCustomer(),
    isHost:     store.isHost(),
    isAdmin:    store.isAdmin(),
    logout,
  }
}