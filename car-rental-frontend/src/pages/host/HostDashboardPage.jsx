import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Car, FileText, AlertCircle } from 'lucide-react'
import { carApi } from '@/api/carApi'
import { bookingApi } from '@/api/bookingApi'
import MainLayout from '@/components/layout/MainLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import HostLayout from '../../components/layout/HostLayout'

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
  <div className="bg-surface border border-border rounded-2xl p-4">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend !== null && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${
          trend > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend > 0 ? (
            <>
              <TrendingUp className="w-3.5 h-3.5" />
              +{trend}%
            </>
          ) : (
            <>
              <TrendingDown className="w-3.5 h-3.5" />
              {trend}%
            </>
          )}
        </div>
      )}
    </div>
    <p className="text-xs font-medium text-primary-subtle uppercase tracking-wider mb-1">
      {label}
    </p>
    <p className="text-2xl font-bold text-primary">
      {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
    </p>
  </div>
)

export default function HostDashboardPage() {
  const navigate = useNavigate()

  const { data: carsRes, isLoading: loadingCars } = useQuery({
    queryKey: ['my-cars'],
    queryFn: () => carApi.getMyCars(),
  })

  const { data: bookingsRes, isLoading: loadingBookings } = useQuery({
    queryKey: ['incoming-bookings'],
    queryFn: () => bookingApi.getIncomingBookings({ page: 0, size: 5 }),
  })

  const cars = carsRes?.data?.data || []
  const bookings = bookingsRes?.data?.data || []

  const stats = {
    totalCars: cars.length,
    activeCars: cars.filter(c => c.status === 'APPROVED').length,
    pendingBookings: bookings.length,
    totalRevenue: cars.reduce((sum, car) => sum + (car.totalRevenue || 0), 0),
  }

  const isLoading = loadingCars || loadingBookings

  if (isLoading) return <LoadingSpinner />

  return (
    <HostLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Tổng quan</h1>
          <p className="text-primary-muted">Quản lý xe và đơn đặt của bạn</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Car}
            label="Xe hoạt động"
            value={stats.activeCars}
            trend={5}
            color="bg-teal-600"
          />
          <StatCard
            icon={FileText}
            label="Đơn chờ xác nhận"
            value={stats.pendingBookings}
            trend={12}
            color="bg-blue-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Doanh thu (tháng)"
            value={`${(stats.totalRevenue / 1_000_000).toFixed(1)}M`}
            trend={8}
            color="bg-green-600"
          />
          <StatCard
            icon={Car}
            label="Tổng số xe"
            value={stats.totalCars}
            trend={null}
            color="bg-amber-600"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incoming Bookings */}
          <div className="lg:col-span-2">
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-primary">Đơn chờ xác nhận</h2>
                <button
                  onClick={() => navigate('/host/bookings')}
                  className="text-teal-600 text-sm font-semibold hover:text-teal-800 transition-colors"
                >
                  Xem tất cả →
                </button>
              </div>

              {bookings.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-primary-muted">Không có đơn chờ xác nhận</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => navigate(`/host/bookings/${booking.id}`)}
                      className="flex items-start justify-between p-3 border border-border rounded-xl
                                 hover:bg-surface-soft transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-primary truncate mb-1">
                          {booking.carName}
                        </h4>
                        <p className="text-xs text-primary-subtle">
                          {booking.customerName} • {booking.startDate} → {booking.endDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {booking.totalPrice?.toLocaleString('vi-VN')}đ
                        </p>
                        <p className="text-xs text-teal-600 font-medium">Chờ xác nhận</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h3 className="text-lg font-bold text-primary mb-4">Hành động nhanh</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/host/cars/new')}
                  className="w-full bg-primary text-white px-4 py-3 rounded-xl text-sm
                             font-semibold hover:bg-primary-soft transition-colors"
                >
                  Đăng xe mới
                </button>
                <button
                  onClick={() => navigate('/host/cars')}
                  className="w-full bg-surface-soft border border-border px-4 py-3
                             rounded-xl text-sm font-semibold text-primary
                             hover:bg-surface-muted transition-colors"
                >
                  Quản lý xe
                </button>
                <button
                  onClick={() => navigate('/host/bookings')}
                  className="w-full bg-surface-soft border border-border px-4 py-3
                             rounded-xl text-sm font-semibold text-primary
                             hover:bg-surface-muted transition-colors"
                >
                  Xem đơn đặt
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-teal-900 text-sm mb-1">
                    Mẹo
                  </h4>
                  <p className="text-xs text-teal-700">
                    Hãy cập nhật lịch xe để tránh xung đột đơn đặt
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HostLayout>
  )
}
