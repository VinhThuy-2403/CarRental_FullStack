import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoggedIn: false,

      // Gọi sau khi login thành công
      setAuth: ({ user, accessToken, refreshToken }) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ user, accessToken, refreshToken, isLoggedIn: true })
      },

      // Cập nhật thông tin user (sau khi edit profile)
      updateUser: (updatedUser) =>
        set((state) => ({ user: { ...state.user, ...updatedUser } })),

      // Logout
      logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, accessToken: null, refreshToken: null, isLoggedIn: false })
      },

      // Helpers
      isCustomer: () => get().user?.role === 'CUSTOMER',
      isHost:     () => get().user?.role === 'HOST',
      isAdmin:    () => get().user?.role === 'ADMIN',
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user:         state.user,
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
        isLoggedIn:   state.isLoggedIn,
      }),
    }
  )
)

export default useAuthStore