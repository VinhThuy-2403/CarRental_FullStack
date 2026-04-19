import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, Eye, Calendar, MapPin, User } from 'lucide-react'
import { bookingApi } from '@/api/bookingApi'
import MainLayout from '@/components/layout/MainLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import HostLayout from '../../components/layout/HostLayout'

const BOOKING_STATUS_LABEL = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  PENDING_CONFIRM: { label: 'Chờ xác nhận', color: 'bg-teal-50 text-teal-600 border-teal-100' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  IN_PROGRESS: { label: 'Đang thuê', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-500 border-gray-200' },
}

export default function IncomingBookingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus] = useState('PENDING_CONFIRM')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const { data: res, isLoading } = useQuery({
    queryKey: ['incoming-bookings', filterStatus],
    queryFn: () =>
      bookingApi.getIncomingBookings({
        page: 0,
        size: 50,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
      }),
  })

  const confirmMutation = useMutation({
    mutationFn: (bookingId) => bookingApi.confirm(bookingId),
    onSuccess: () => {
      toast.success('Xác nhận đơn thành công')
      queryClient.invalidateQueries(['incoming-bookings'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Xác nhận thất bại')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (bookingId) =>
      bookingApi.reject(bookingId, rejectReason),
    onSuccess: () => {
      toast.success('Từ chối đơn thành công')
      queryClient.invalidateQueries(['incoming-bookings'])
      setShowRejectModal(false)
      setRejectReason('')
      setSelectedBooking(null)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Từ chối thất bại')
    },
  })

  const completeMutation = useMutation({
    mutationFn: (bookingId) => bookingApi.complete(bookingId),
    onSuccess: () => {
      toast.success('Xác nhận trả xe thành công')
      queryClient.invalidateQueries(['incoming-bookings'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Xác nhận trả xe thất bại')
    },
  })

  const bookings = res?.data?.data || []

  if (isLoading) return <LoadingSpinner />

  return (
    <HostLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Đơn đặt xe</h1>
          <p className="text-primary-muted">Quản lý các đơn đặt từ khách hàng</p>
        </div>

        {/* Filter */}
        <div className="bg-surface border border-border rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'ALL'
                  ? 'bg-primary text-white'
                  : 'bg-surface-soft text-primary hover:bg-surface-muted'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterStatus('PENDING_CONFIRM')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'PENDING_CONFIRM'
                  ? 'bg-teal-600 text-white'
                  : 'bg-surface-soft text-primary hover:bg-surface-muted'
              }`}
            >
              Chờ xác nhận
            </button>
            <button
              onClick={() => setFilterStatus('CONFIRMED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'CONFIRMED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-surface-soft text-primary hover:bg-surface-muted'
              }`}
            >
              Đã xác nhận
            </button>
            <button
              onClick={() => setFilterStatus('IN_PROGRESS')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'IN_PROGRESS'
                  ? 'bg-purple-600 text-white'
                  : 'bg-surface-soft text-primary hover:bg-surface-muted'
              }`}
            >
              Đang thuê
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-12 text-center">
            <p className="text-primary-muted">Không có đơn đặt</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-surface border border-border rounded-2xl overflow-hidden
                           hover:shadow-card transition-all"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-primary mb-1">
                        {booking.carName}
                      </h3>
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border ${
                          BOOKING_STATUS_LABEL[booking.status]?.color
                        }`}
                      >
                        {BOOKING_STATUS_LABEL[booking.status]?.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary mb-1">
                        {booking.totalPrice?.toLocaleString('vi-VN')}đ
                      </p>
                      <p className="text-xs text-primary-subtle">
                        {booking.totalDays} ngày
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="bg-surface-soft rounded-xl p-4 mb-4 space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <User className="w-4 h-4 text-primary-muted" />
                      <span className="text-primary-muted">
                        <span className="font-medium text-primary">
                          {booking.customerName}
                        </span>
                        {booking.customerPhone && ` • ${booking.customerPhone}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-primary-muted" />
                      <span className="text-primary-muted">
                        {booking.startDate} → {booking.endDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-primary-muted" />
                      <span className="text-primary-muted">{booking.pickupLocation}</span>
                    </div>

                    {booking.note && (
                      <div className="text-sm">
                        <p className="text-xs font-medium text-primary-subtle mb-1">
                          Ghi chú:
                        </p>
                        <p className="text-primary-muted">{booking.note}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/host/bookings/${booking.id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-surface-soft border
                                 border-border rounded-lg text-sm font-medium text-primary
                                 hover:bg-surface-muted transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Chi tiết
                    </button>

                    {booking.status === 'PENDING_CONFIRM' && (
                      <>
                        <button
                          onClick={() =>
                            confirmMutation.mutate(booking.id)
                          }
                          disabled={confirmMutation.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white
                                     rounded-lg text-sm font-medium hover:bg-green-700 transition-colors
                                     disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          Xác nhận
                        </button>

                        <button
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowRejectModal(true)
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 border
                                     border-red-200 rounded-lg text-sm font-medium text-red-600
                                     hover:bg-red-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Từ chối
                        </button>
                      </>
                    )}

                    {booking.status === 'CONFIRMED' && (
                      <button
                        onClick={() =>
                          completeMutation.mutate(booking.id)
                        }
                        disabled={completeMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white
                                   rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors
                                   disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        Xác nhận trả xe
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-primary mb-4">Từ chối đơn đặt</h2>

            <div className="bg-surface-soft rounded-xl p-3 mb-4">
              <p className="text-sm text-primary-muted">
                <span className="font-medium text-primary">{selectedBooking.carName}</span>
                <br />
                {selectedBooking.startDate} → {selectedBooking.endDate}
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
                placeholder="Vui lòng nhập lý do từ chối..."
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
                  setSelectedBooking(null)
                }}
                className="flex-1 bg-surface-soft border border-border text-primary px-4 py-2.5
                           rounded-lg text-sm font-medium hover:bg-surface-muted transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  rejectMutation.mutate(selectedBooking.id)
                }
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm
                           font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </HostLayout>
  )
}
