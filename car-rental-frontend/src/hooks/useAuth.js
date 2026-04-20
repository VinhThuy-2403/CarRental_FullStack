import useAuthStore from '@/store/authStore'
import { authApi } from '@/api/authApi'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
  const store       = useAuthStore()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } catch {
      // ignore — vẫn logout phía client dù server lỗi
    } finally {
      // Xóa toàn bộ React Query cache để tài khoản mới
      // không nhìn thấy data cũ của tài khoản trước
      queryClient.clear()

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
    updateUser: store.updateUser,
    logout,
  }
}