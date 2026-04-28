import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, X, Loader, Calendar, MapPin, User, Phone, Mail } from 'lucide-react'
import { bookingApi } from '@/api/bookingApi'
import MainLayout from '@/components/layout/MainLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { useState } from 'react'

const BOOKING_STATUS_LABEL = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  PENDING_CONFIRM: { label: 'Chờ xác nhận', color: 'bg-teal-50 text-teal-600 border-teal-100' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  IN_PROGRESS: { label: 'Đang thuê', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-500 border-gray-200' },
}

export default function BookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const { data: res, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.getDetail(id),
  })

  const startMutation = useMutation({
    mutationFn: () => bookingApi.start(id),
    onSuccess: () => {
      toast.success('Xác nhận giao xe thành công')
      queryClient.invalidateQueries(['booking', id])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Xác nhận giao xe thất bại')
    },
  })

  const confirmMutation = useMutation({
    mutationFn: () => bookingApi.confirm(id),
    onSuccess: () => {
      toast.success('Xác nhận đơn thành công')
      queryClient.invalidateQueries(['booking', id])
      navigate('/host/bookings')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Xác nhận thất bại')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => bookingApi.reject(id, rejectReason),
    onSuccess: () => {
      toast.success('Từ chối đơn thành công')
      queryClient.invalidateQueries(['booking', id])
      setShowRejectModal(false)
      navigate('/host/bookings')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Từ chối thất bại')
    },
  })

  const completeMutation = useMutation({
    mutationFn: () => bookingApi.complete(id),
    onSuccess: () => {
      toast.success('Xác nhận trả xe thành công')
      queryClient.invalidateQueries(['booking', id])
      navigate('/host/bookings')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Xác nhận trả xe thất bại')
    },
  })

  if (isLoading) return <LoadingSpinner />

  const booking = res?.data?.data

  if (!booking) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-primary-muted">Không tìm thấy đơn đặt</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/host/bookings')}
          className="flex items-center gap-2 text-teal-600 font-semibold mb-6
                     hover:text-teal-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Booking details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-primary mb-2">
                    {booking.carName}
                  </h1>
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold border ${
                      BOOKING_STATUS_LABEL[booking.status]?.color
                    }`}
                  >
                    {BOOKING_STATUS_LABEL[booking.status]?.label}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary mb-1">
                    {booking.totalPrice?.toLocaleString('vi-VN')}đ
                  </p>
                  <p className="text-sm text-primary-muted">{booking.totalDays} ngày</p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h2 className="text-lg font-bold text-primary mb-4">Thông tin khách hàng</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary-muted" />
                  <div>
                    <p className="text-xs text-primary-subtle">Tên khách</p>
                    <p className="font-semibold text-primary">{booking.customerName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary-muted" />
                  <div>
                    <p className="text-xs text-primary-subtle">Số điện thoại</p>
                    <p className="font-semibold text-primary">{booking.customerPhone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary-muted" />
                  <div>
                    <p className="text-xs text-primary-subtle">Email</p>
                    <p className="font-semibold text-primary">{booking.customerEmail}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rental Details */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h2 className="text-lg font-bold text-primary mb-4">Chi tiết thuê xe</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-primary-subtle mb-1">Ngày nhận xe</p>
                    <p className="font-semibold text-primary">{booking.startDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-subtle mb-1">Ngày trả xe</p>
                    <p className="font-semibold text-primary">{booking.endDate}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-primary-subtle mb-2">Địa điểm giao xe</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary-muted mt-0.5 flex-shrink-0" />
                    <p className="text-primary">{booking.pickupLocation}</p>
                  </div>
                </div>

                {booking.note && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-primary-subtle mb-2">Ghi chú từ khách</p>
                    <p className="text-primary italic">{booking.note}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h2 className="text-lg font-bold text-primary mb-4">Chi tiết giá</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <p className="text-primary-muted">
                    {booking.pricePerDay?.toLocaleString('vi-VN')}đ × {booking.totalDays} ngày
                  </p>
                  <p className="font-semibold text-primary">
                    {(booking.pricePerDay * booking.totalDays)?.toLocaleString('vi-VN')}đ
                  </p>
                </div>
                {booking.deposit > 0 && (
                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <p className="text-primary-muted">Đặt cọc</p>
                    <p className="font-semibold text-primary">
                      {booking.deposit?.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 bg-teal-50 px-3 py-2 rounded-lg">
                  <p className="font-bold text-teal-900">Tổng cộng</p>
                  <p className="font-bold text-teal-600 text-lg">
                    {booking.totalPrice?.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-2xl p-6 sticky top-8">
              <h3 className="text-lg font-bold text-primary mb-4">Hành động</h3>

              {booking.status === 'PENDING_CONFIRM' && (
                <div className="space-y-3">
                  <button
                    onClick={() => confirmMutation.mutate()}
                    disabled={confirmMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3
                               bg-green-600 text-white rounded-xl text-sm font-semibold
                               hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {confirmMutation.isPending ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Xác nhận đơn
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3
                               bg-red-50 border border-red-200 text-red-600 rounded-xl
                               text-sm font-semibold hover:bg-red-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Từ chối
                  </button>
                </div>
              )}

              {booking.status === 'CONFIRMED' && (
              <button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3
                          bg-blue-600 text-white rounded-xl text-sm font-semibold
                          hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {startMutation.isPending ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                ) : (
                  <><Check className="w-4 h-4" /> Xác nhận giao xe</>
                )}
              </button>
            )}

            {booking.status === 'IN_PROGRESS' && (
  <button
    onClick={() => completeMutation.mutate()}
    disabled={completeMutation.isPending}
    className="w-full flex items-center justify-center gap-2 px-4 py-3
               bg-teal-600 text-white rounded-xl text-sm font-semibold
               hover:bg-teal-700 transition-colors disabled:opacity-50"
  >
    {completeMutation.isPending ? (
      <><Loader className="w-4 h-4 animate-spin" /> Đang xử lý...</>
    ) : (
      <><Check className="w-4 h-4" /> Xác nhận trả xe</>
    )}
  </button>
)}

              {booking.status === 'COMPLETED' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-sm font-semibold text-green-700">
                    ✓ Đơn đã hoàn thành
                  </p>
                </div>
              )}

              {booking.status === 'CANCELLED' && (
                <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-sm font-semibold text-gray-600">
                    Đơn đã hủy
                  </p>
                </div>
              )}

              {/* Info box */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs text-blue-700 leading-relaxed">
                  💡 <span className="font-medium">Lưu ý:</span> Xác nhận sẽ thông báo cho khách hàng.
                  Từ chối sẽ hoàn tiền cho khách.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-primary mb-4">Từ chối đơn đặt</h2>

            <div className="bg-surface-soft rounded-xl p-3 mb-4">
              <p className="text-sm text-primary-muted">
                <span className="font-medium text-primary">{booking.carName}</span>
                <br />
                {booking.startDate} → {booking.endDate}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-primary-subtle uppercase
                               tracking-wider mb-2">
                Lý do từ chối
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối đơn đặt này..."
                rows={4}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2.5
                           text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                           focus:border-teal-400 transition-all resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                }}
                className="flex-1 bg-surface-soft border border-border text-primary px-4 py-2.5
                           rounded-lg text-sm font-medium hover:bg-surface-muted transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm
                           font-medium hover:bg-red-700 transition-colors disabled:opacity-50
                           flex items-center justify-center gap-2"
              >
                {rejectMutation.isPending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    Từ chối đơn
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
