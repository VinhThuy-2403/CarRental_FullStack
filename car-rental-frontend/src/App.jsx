import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/common/ProtectedRoute'

// Auth
import LoginPage          from './pages/auth/LoginPage'
import RegisterPage       from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage  from './pages/auth/ResetPasswordPage'

// Public
import HomePage      from '@/pages/public/HomePage'
import CarSearchPage from '@/pages/public/CarSearchPage'
import CarDetailPage from '@/pages/public/CarDetailPage'

// Common (Customer + Host)
import ProfilePage from '@/pages/common/ProfilePage'

// Customer
import BookingPage       from '@/pages/customer/BookingPage'
import PaymentResultPage from '@/pages/customer/PaymentResultPage'
import MyBookingsPage    from '@/pages/customer/MyBookingsPage'
import BookingDetailPage from '@/pages/customer/BookingDetailPage'

// Host
import HostDashboardPage    from '@/pages/host/HostDashboardPage'
import CarFormPage          from '@/pages/host/CarFormPage'
import IncomingBookingsPage from '@/pages/host/IncomingBookingsPage'
import MyCarsPage           from '@/pages/host/MyCarsPage'
import CalendarSelectPage   from '@/pages/host/CalendarSelectPage'
import CarCalendarPage      from '@/pages/host/CarCalendarPage'

// Admin
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminCarsPage      from '@/pages/admin/AdminCarsPage'
import AdminUsersPage     from '@/pages/admin/AdminUsersPage'
import AdminBookingsPage  from '@/pages/admin/AdminBookingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>

          {/* ── Public ─────────────────────────────────────── */}
          <Route path="/"                element={<HomePage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />

          {/* ── Car (public) ────────────────────────────────── */}
          <Route path="/cars"     element={<CarSearchPage />} />
          <Route path="/cars/:id" element={<CarDetailPage />} />

          {/* ── Profile (Customer + Host) ────────────────────── */}
          <Route path="/profile" element={
            <ProtectedRoute roles={['CUSTOMER', 'HOST']}>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* ── Customer only ────────────────────────────────── */}

          {/* Đặt xe: /booking/:carId (navigate từ CarDetailPage) */}
          <Route path="/booking/:carId" element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <BookingPage />
            </ProtectedRoute>
          } />

          {/* Kết quả thanh toán: VNPay/MoMo redirect về đây */}
          {/* Public vì VNPay redirect không giữ session */}
          <Route path="/payment/result" element={<PaymentResultPage />} />

          {/* Lịch sử đơn */}
          <Route path="/bookings" element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <MyBookingsPage />
            </ProtectedRoute>
          } />

          {/* Chi tiết đơn (Customer + Host cùng dùng) */}
          <Route path="/bookings/:id" element={
            <ProtectedRoute roles={['CUSTOMER', 'HOST']}>
              <BookingDetailPage />
            </ProtectedRoute>
          } />

          {/* ── Host only ────────────────────────────────────── */}
          <Route path="/host" element={
            <ProtectedRoute roles={['HOST']}><HostDashboardPage /></ProtectedRoute>
          } />
          <Route path="/host/cars" element={
            <ProtectedRoute roles={['HOST']}><MyCarsPage /></ProtectedRoute>
          } />
          <Route path="/host/cars/new" element={
            <ProtectedRoute roles={['HOST']}><CarFormPage /></ProtectedRoute>
          } />
          <Route path="/host/cars/:id/edit" element={
            <ProtectedRoute roles={['HOST']}><CarFormPage /></ProtectedRoute>
          } />
          <Route path="/host/bookings" element={
            <ProtectedRoute roles={['HOST']}><IncomingBookingsPage /></ProtectedRoute>
          } />
          <Route path="/host/calendar" element={
            <ProtectedRoute roles={['HOST']}><CalendarSelectPage /></ProtectedRoute>
          } />
          <Route path="/host/calendar/:carId" element={
            <ProtectedRoute roles={['HOST']}><CarCalendarPage /></ProtectedRoute>
          } />

          {/* ── Admin only ───────────────────────────────────── */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>
          } />
          <Route path="/admin/cars" element={
            <ProtectedRoute roles={['ADMIN']}><AdminCarsPage /></ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute roles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>
          } />
          <Route path="/admin/bookings" element={
            <ProtectedRoute roles={['ADMIN']}><AdminBookingsPage /></ProtectedRoute>
          } />

          {/* ── Fallback ─────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#111',
              color: '#fff',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#1D9E75', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}