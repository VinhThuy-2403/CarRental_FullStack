import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

/**
 * Bảo vệ route theo role.
 *
 * Dùng:
 *   <ProtectedRoute>                         — chỉ cần đăng nhập
 *   <ProtectedRoute roles={['HOST']}>        — chỉ HOST
 *   <ProtectedRoute roles={['ADMIN']}>       — chỉ ADMIN
 *   <ProtectedRoute roles={['CUSTOMER','HOST']}> — CUSTOMER hoặc HOST
 */
export default function ProtectedRoute({ children, roles }) {
  const { isLoggedIn, user } = useAuthStore()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    // Redirect về trang phù hợp với role
    if (user?.role === 'ADMIN')    return <Navigate to="/admin"  replace />
    if (user?.role === 'HOST')     return <Navigate to="/host"   replace />
    if (user?.role === 'CUSTOMER') return <Navigate to="/"       replace />
    return <Navigate to="/" replace />
  }

  return children
}