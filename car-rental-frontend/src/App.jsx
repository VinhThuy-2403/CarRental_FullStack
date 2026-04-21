import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/common/ProtectedRoute'

import LoginPage           from './pages/auth/LoginPage'
import RegisterPage        from './pages/auth/RegisterPage'
import ForgotPasswordPage  from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage   from './pages/auth/ResetPasswordPage'

import HomePage      from '@/pages/public/HomePage'
import CarSearchPage from '@/pages/public/CarSearchPage'
import CarDetailPage from '@/pages/public/CarDetailPage'
import ProfilePage   from '@/pages/common/ProfilePage'

import HostDashboardPage    from '@/pages/host/HostDashboardPage'
import CarFormPage          from '@/pages/host/CarFormPage'
import IncomingBookingsPage from '@/pages/host/IncomingBookingsPage'
import MyCarsPage           from '@/pages/host/MyCarsPage'
import CalendarSelectPage   from '@/pages/host/CalendarSelectPage'
import CarCalendarPage      from '@/pages/host/CarCalendarPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
})

const AdminPage = () => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
  </div>
)

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/"                element={<HomePage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />

          <Route path="/cars"     element={<CarSearchPage />} />
          <Route path="/cars/:id" element={<CarDetailPage />} />

          <Route path="/profile" element={
            <ProtectedRoute roles={['CUSTOMER', 'HOST']}>
              <ProfilePage />
            </ProtectedRoute>
          } />

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

          <Route path="/admin/*" element={
            <ProtectedRoute roles={['ADMIN']}><AdminPage /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: '#111', color: '#fff', borderRadius: '10px', fontSize: '14px' },
            success: { iconTheme: { primary: '#1D9E75', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}