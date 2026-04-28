import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Car, Clock, CheckCircle, XCircle,
  ChevronRight, ChevronLeft, MapPin,
} from 'lucide-react'
import { bookingApi } from '@/api/bookingApi'
import MainLayout from '@/components/layout/MainLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'

// ─── Config ───────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    cls:   'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon:  <Clock className="w-4 h-4 text-yellow-500" />,
  },
  PENDING_CONFIRM: {
    label: 'Chờ xác nhận',
    cls:   'bg-teal-50 text-teal-600 border-teal-100',
    icon:  <Clock className="w-4 h-4 text-teal-500" />,
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    cls:   'bg-teal-50 text-teal-800 border-teal-200',
    icon:  <CheckCircle className="w-4 h-4 text-teal-600" />,
  },
  IN_PROGRESS: {
    label: 'Đang thuê',
    cls:   'bg-blue-50 text-blue-700 border-blue-200',
    icon:  <Car className="w-4 h-4 text-blue-500" />,
  },
  COMPLETED: {
    label: 'Hoàn thành',
    cls:   'bg-green-50 text-green-700 border-green-200',
    icon:  <CheckCircle className="w-4 h-4 text-green-500" />,
  },
  CANCELLED: {
    label: 'Đã hủy',
    cls:   'bg-gray-100 text-gray-500 border-gray-200',
    icon:  <XCircle className="w-4 h-4 text-gray-400" />,
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    cls:   'bg-purple-50 text-purple-600 border-purple-200',
    icon:  <CheckCircle className="w-4 h-4 text-purple-500" />,
  },
}

const FILTER_TABS = [
  { key: '',                label: 'Tất cả' },
  { key: 'PENDING_CONFIRM', label: 'Chờ xác nhận' },
  { key: 'CONFIRMED',       label: 'Đã xác nhận' },
  { key: 'IN_PROGRESS',     label: 'Đang thuê' },
  { key: 'COMPLETED',       label: 'Hoàn thành' },
  { key: 'CANCELLED',       label: 'Đã hủy' },
]

const PAYMENT_LABEL = { VNPAY: 'VNPay', MOMO: 'MoMo', CASH: 'Tiền mặt' }

// ─── Booking card ─────────────────────────────────────
function BookingCard({ booking, onClick }) {
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CANCELLED
  return (
    <div
      onClick={onClick}
      className="bg-surface border border-border rounded-2xl overflow-hidden
                 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="flex gap-4 p-4">
        {/* Ảnh xe */}
        <div className="w-24 h-20 rounded-xl overflow-hidden bg-surface-muted shrink-0">
          {booking.carImageUrl ? (
            <img src={booking.carImageUrl} alt={booking.carName}
                 className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="w-6 h-6 text-primary-subtle opacity-40" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-primary text-sm truncate">{booking.carName}</h3>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border
                             whitespace-nowrap shrink-0 ${cfg.cls}`}>
              {cfg.label}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-primary-subtle mb-2">
            <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
            {booking.province}
          </div>

          <div className="flex items-center gap-1 text-xs text-primary-muted mb-3">
            {cfg.icon}
            <span>
              {booking.startDate} → {booking.endDate}
              {booking.totalDays && ` (${booking.totalDays} ngày)`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-base font-bold text-primary">
                {Number(booking.totalPrice).toLocaleString('vi-VN')}đ
              </span>
              <span className="text-xs text-primary-subtle ml-1">
                · {PAYMENT_LABEL[booking.paymentMethod] || booking.paymentMethod}
              </span>
            </div>
            <div className="flex items-center gap-1 text-teal-600 text-xs font-semibold">
              Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────
export default function MyBookingsPage() {
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(0)

  const { data: res, isLoading } = useQuery({
    queryKey: ['my-bookings', filterStatus, page],
    queryFn:  () => bookingApi.getMyBookings({
      page, size: 8,
    }),
    keepPreviousData: true,
  })

  const data       = res?.data?.data
  const allBookings = data?.content     || []
  const totalPages  = data?.totalPages  || 0
  const totalItems  = data?.totalElements || 0

  // Filter client-side để tab hoạt động với pagination
  const bookings = filterStatus
    ? allBookings.filter(b => b.status === filterStatus)
    : allBookings

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Đơn đặt xe của tôi</h1>
          <p className="text-sm text-primary-subtle mt-0.5">
            Theo dõi và quản lý các chuyến đi
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setFilterStatus(tab.key); setPage(0) }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap
                           transition-all shrink-0 ${
                filterStatus === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-primary-muted hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <Car className="w-16 h-16 text-primary-subtle mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-bold text-primary mb-2">Chưa có đơn đặt xe</h3>
            <p className="text-primary-subtle mb-6 text-sm">
              {filterStatus
                ? 'Không có đơn nào ở trạng thái này'
                : 'Bạn chưa đặt xe nào. Hãy tìm và đặt xe để bắt đầu hành trình!'}
            </p>
            {!filterStatus && (
              <button onClick={() => navigate('/cars')} className="btn-teal px-6 py-2.5">
                Tìm xe ngay
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && !filterStatus && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-primary-subtle">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}