import { useQuery } from '@tanstack/react-query'
import {
  Car, Users, FileText, Clock,
  TrendingUp, CheckCircle, AlertCircle, UserX,
} from 'lucide-react'
import { adminApi } from '@/api/adminApi'
import AdminLayout from '@/components/layout/AdminLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useNavigate } from 'react-router-dom'

// ─── Sub-components ───────────────────────────────────

function StatCard({ icon, label, value, sub, color = 'teal', onClick }) {
  const colors = {
    teal:   'bg-teal-50 text-teal-600',
    amber:  'bg-amber-50 text-amber-600',
    blue:   'bg-blue-50 text-blue-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    green:  'bg-green-50 text-green-600',
  }
  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-border rounded-2xl p-5
                  ${onClick ? 'cursor-pointer hover:shadow-card hover:-translate-y-0.5' : ''}
                  transition-all duration-200`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-primary">{value?.toLocaleString('vi-VN')}</p>
      <p className="text-sm text-primary-muted mt-0.5">{label}</p>
      {sub && <p className="text-xs text-primary-subtle mt-1">{sub}</p>}
    </div>
  )
}

function MiniBar({ date, count, max }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  const day  = new Date(date).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' })
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <span className="text-xs font-semibold text-primary">{count}</span>
      <div className="w-full bg-surface-muted rounded-full overflow-hidden" style={{ height: 60 }}>
        <div
          className="w-full bg-teal-400 rounded-full transition-all duration-500"
          style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
        />
      </div>
      <span className="text-xs text-primary-subtle whitespace-nowrap">{day}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn:  () => adminApi.getDashboard(),
    refetchInterval: 60_000, // auto-refresh mỗi phút
  })

  const d = res?.data?.data

  if (isLoading) return (
    <AdminLayout>
      <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
    </AdminLayout>
  )

  const maxBookings = Math.max(...(d?.bookingsByDay?.map(b => b.count) || [1]), 1)

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <p className="text-sm text-primary-subtle mt-0.5">Tổng quan hệ thống XeGo</p>
        </div>

        {/* ── Row 1: Xe ─────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold text-primary-subtle uppercase tracking-wider mb-3">
            Xe cho thuê
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Car className="w-5 h-5" />}
              label="Tổng số xe" value={d?.totalCars} color="blue" />
            <StatCard icon={<Clock className="w-5 h-5" />}
              label="Chờ duyệt" value={d?.pendingCars} color="amber"
              sub={d?.pendingCars > 0 ? 'Cần xử lý' : 'Không có'}
              onClick={() => navigate('/admin/cars?status=PENDING')} />
            <StatCard icon={<CheckCircle className="w-5 h-5" />}
              label="Đã duyệt" value={d?.approvedCars} color="teal" />
            <StatCard icon={<AlertCircle className="w-5 h-5" />}
              label="Bị từ chối" value={d?.rejectedCars} color="red" />
          </div>
        </section>

        {/* ── Row 2: User ───────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold text-primary-subtle uppercase tracking-wider mb-3">
            Người dùng
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Users className="w-5 h-5" />}
              label="Tổng user" value={d?.totalUsers} color="purple" />
            <StatCard icon={<Users className="w-5 h-5" />}
              label="Khách hàng" value={d?.totalCustomers} color="blue"
              onClick={() => navigate('/admin/users?role=CUSTOMER')} />
            <StatCard icon={<Car className="w-5 h-5" />}
              label="Chủ xe (Host)" value={d?.totalHosts} color="teal"
              onClick={() => navigate('/admin/users?role=HOST')} />
            <StatCard icon={<UserX className="w-5 h-5" />}
              label="Bị khóa" value={d?.lockedUsers} color="red"
              sub={`${d?.newUsersThisMonth} user mới tháng này`}
              onClick={() => navigate('/admin/users?status=LOCKED')} />
          </div>
        </section>

        {/* ── Row 3: Booking + Chart ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Booking stats */}
          <section className="lg:col-span-1 space-y-3">
            <h2 className="text-xs font-bold text-primary-subtle uppercase tracking-wider">
              Đơn đặt xe
            </h2>
            {[
              { label: 'Hôm nay',    val: d?.bookingsToday,     color: 'text-primary' },
              { label: 'Tuần này',   val: d?.bookingsThisWeek,  color: 'text-primary' },
              { label: 'Tháng này',  val: d?.bookingsThisMonth, color: 'text-teal-600' },
              { label: 'Chờ xác nhận', val: d?.pendingConfirmBookings, color: 'text-amber-600' },
              { label: 'Hoàn thành', val: d?.completedBookings, color: 'text-green-600' },
            ].map((row) => (
              <div key={row.label}
                   className="bg-surface border border-border rounded-xl px-4 py-3
                              flex items-center justify-between">
                <span className="text-sm text-primary-muted">{row.label}</span>
                <span className={`text-lg font-bold ${row.color}`}>
                  {row.val?.toLocaleString('vi-VN')}
                </span>
              </div>
            ))}
            <button
              onClick={() => navigate('/admin/bookings')}
              className="w-full btn-secondary py-2.5 text-sm"
            >
              Xem tất cả đơn →
            </button>
          </section>

          {/* Chart 7 ngày */}
          <section className="lg:col-span-2 bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-primary">Đơn đặt 7 ngày qua</h2>
                <p className="text-xs text-primary-subtle mt-0.5">
                  Tổng: {d?.bookingsByDay?.reduce((s, b) => s + b.count, 0)} đơn
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-teal-400" />
            </div>
            <div className="flex items-end gap-2 h-20">
              {d?.bookingsByDay?.map((b) => (
                <MiniBar key={b.date} date={b.date} count={b.count} max={maxBookings} />
              ))}
            </div>
          </section>
        </div>

        {/* ── Top xe ────────────────────────────────── */}
        {d?.topCars?.length > 0 && (
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-bold text-primary">Top xe được đặt nhiều nhất</h2>
              <button
                onClick={() => navigate('/admin/cars')}
                className="btn-ghost text-sm"
              >
                Xem tất cả →
              </button>
            </div>
            <div className="divide-y divide-border">
              {d.topCars.map((car, idx) => (
                <div key={car.carId}
                     className="flex items-center gap-4 px-5 py-3 hover:bg-surface-soft
                                transition-colors">
                  <span className={`text-lg font-bold w-6 text-center shrink-0 ${
                    idx === 0 ? 'text-amber-500' :
                    idx === 1 ? 'text-gray-400' :
                    idx === 2 ? 'text-orange-400' : 'text-primary-subtle'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="w-12 h-9 rounded-lg overflow-hidden bg-surface-muted shrink-0">
                    {car.imageUrl
                      ? <img src={car.imageUrl} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-4 h-4 text-primary-subtle opacity-40" />
                        </div>
                    }
                  </div>
                  <span className="flex-1 text-sm font-semibold text-primary truncate">
                    {car.carName}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-sm font-bold text-teal-600">{car.bookingCount}</span>
                    <span className="text-xs text-primary-subtle">đơn</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </AdminLayout>
  )
}