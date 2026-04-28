import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, Car, MapPin, Calendar, Users, CreditCard,
  Phone, IdCard, CheckCircle, XCircle, Clock, AlertCircle,
  Loader, X, Banknote, Wallet, ArrowRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { bookingApi } from '@/api/bookingApi'
import { paymentApi } from '@/api/paymentApi'
import MainLayout from '@/components/layout/MainLayout'
import { PageLoader } from '@/components/common/LoadingSpinner'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import useAuthStore from '@/store/authStore'

// ─── Config ───────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    cls:   'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon:  <Clock className="w-5 h-5 text-yellow-500" />,
    desc:  'Vui lòng hoàn tất thanh toán để đơn được gửi đến Host.',
  },
  PENDING_CONFIRM: {
    label: 'Chờ Host xác nhận',
    cls:   'bg-teal-50 text-teal-600 border-teal-100',
    icon:  <Clock className="w-5 h-5 text-teal-500" />,
    desc:  'Đơn đã thanh toán. Host sẽ xác nhận trong vòng 2 giờ.',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    cls:   'bg-teal-50 text-teal-800 border-teal-200',
    icon:  <CheckCircle className="w-5 h-5 text-teal-600" />,
    desc:  'Host đã xác nhận. Xe đã được giữ cho bạn!',
  },
  IN_PROGRESS: {
    label: 'Đang sử dụng xe',
    cls:   'bg-blue-50 text-blue-700 border-blue-200',
    icon:  <Car className="w-5 h-5 text-blue-500" />,
    desc:  'Chuyến đi đang diễn ra. Chúc bạn có chuyến đi vui!',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    cls:   'bg-green-50 text-green-700 border-green-200',
    icon:  <CheckCircle className="w-5 h-5 text-green-500" />,
    desc:  'Chuyến đi đã hoàn thành. Cảm ơn bạn đã sử dụng XeGo!',
  },
  CANCELLED: {
    label: 'Đã hủy',
    cls:   'bg-gray-100 text-gray-500 border-gray-200',
    icon:  <XCircle className="w-5 h-5 text-gray-400" />,
    desc:  'Đơn đặt xe đã bị hủy.',
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    cls:   'bg-purple-50 text-purple-600 border-purple-200',
    icon:  <CheckCircle className="w-5 h-5 text-purple-500" />,
    desc:  'Tiền đã được hoàn trả về tài khoản của bạn trong 3-5 ngày làm việc.',
  },
}

const PAYMENT_LABEL = {
  VNPAY: { label: 'VNPay', icon: <CreditCard className="w-4 h-4" />, cls: 'text-blue-600 bg-blue-50' },
  MOMO:  { label: 'MoMo',  icon: <Wallet    className="w-4 h-4" />, cls: 'text-pink-600 bg-pink-50' },
  CASH:  { label: 'Tiền mặt', icon: <Banknote className="w-4 h-4" />, cls: 'text-teal-600 bg-teal-50' },
}

// Tính chính sách hoàn tiền
function getRefundPolicy(startDate) {
  if (!startDate) return null
  const now     = new Date()
  const pickup  = new Date(startDate)
  const hoursLeft = (pickup - now) / (1000 * 60 * 60)
  if (hoursLeft >= 24) return { pct: 100, label: 'Hoàn 100% tiền cọc (hủy trước 24h)' }
  if (hoursLeft > 0)   return { pct: 50,  label: 'Hoàn 50% tiền cọc (hủy trong vòng 24h)' }
  return null
}

// ─── Modal Hủy đơn ────────────────────────────────────
function CancelModal({ booking, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState('')
  const policy = getRefundPolicy(booking?.startDate)

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-modal w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-primary">Hủy đơn đặt xe</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-primary-muted" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Chính sách hoàn tiền */}
          {policy && (
            <div className={`rounded-xl p-4 border ${
              policy.pct === 100
                ? 'bg-teal-50 border-teal-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  policy.pct === 100 ? 'text-teal-600' : 'text-amber-600'
                }`} />
                <div>
                  <p className={`text-sm font-semibold ${
                    policy.pct === 100 ? 'text-teal-800' : 'text-amber-800'
                  }`}>
                    {policy.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${
                    policy.pct === 100 ? 'text-teal-700' : 'text-amber-700'
                  }`}>
                    Tiền hoàn sẽ được trả trong 3–5 ngày làm việc
                  </p>
                </div>
              </div>
            </div>
          )}
          {!policy && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-800">Không thể hoàn tiền</p>
              <p className="text-xs text-red-700 mt-0.5">
                Thời gian nhận xe đã qua, bạn sẽ không được hoàn tiền cọc.
              </p>
            </div>
          )}

          {/* Lý do */}
          <div>
            <label className="block text-xs font-semibold text-primary-subtle
                               uppercase tracking-wider mb-1.5">
              Lý do hủy (tuỳ chọn)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do hủy đơn..."
              rows={3}
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                         text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                         focus:border-teal-400 transition-all resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-border">
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 btn-danger flex items-center justify-center gap-2 py-2.5"
          >
            {loading && <LoadingSpinner size="sm" />}
            Xác nhận hủy đơn
          </button>
          <button onClick={onClose} className="flex-1 btn-secondary py-2.5">
            Không hủy
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────
function StatusTimeline({ status }) {
  const steps = [
    { key: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
    { key: 'PENDING_CONFIRM', label: 'Chờ xác nhận'   },
    { key: 'CONFIRMED',       label: 'Đã xác nhận'    },
    { key: 'IN_PROGRESS',     label: 'Đang thuê'       },
    { key: 'COMPLETED',       label: 'Hoàn thành'      },
  ]

  const cancelledOrRefunded = ['CANCELLED', 'REFUNDED'].includes(status)
  const currentIdx = steps.findIndex(s => s.key === status)

  if (cancelledOrRefunded) return null

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const done    = i < currentIdx
        const current = i === currentIdx
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                               font-bold transition-all ${
                done    ? 'bg-teal-500 text-white' :
                current ? 'bg-primary text-white ring-4 ring-primary/20' :
                          'bg-surface-muted text-primary-subtle border border-border'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs whitespace-nowrap ${
                current ? 'font-semibold text-primary' : 'text-primary-subtle'
              }`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-8 sm:w-12 mx-1 mb-5 shrink-0 transition-all ${
                i < currentIdx ? 'bg-teal-400' : 'bg-border'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── InfoRow ──────────────────────────────────────────
function InfoRow({ label, value, bold = false }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-primary-muted shrink-0">{label}</span>
      <span className={`text-sm text-right ${bold ? 'font-bold text-primary' : 'text-primary font-medium'}`}>
        {value}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────
export default function BookingDetailPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const { user }    = useAuthStore()
  const isCustomer  = user?.role === 'CUSTOMER'

  const [showCancel, setShowCancel] = useState(false)
  const [repaying,   setRepaying]   = useState(false)

  // ── Fetch booking ─────────────────────────────────────
  const { data: res, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn:  () => bookingApi.getDetail(id),
  })
  const booking = res?.data?.data

  // ── Fetch payment info ────────────────────────────────
  const { data: payRes } = useQuery({
    queryKey: ['payment', id],
    queryFn:  () => paymentApi.getByBooking(id),
    enabled:  !!id && booking?.status !== 'PENDING_PAYMENT',
  })
  const payment = payRes?.data?.data

  // ── Cancel mutation ───────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => bookingApi.cancel(id, reason),
    onSuccess: () => {
      toast.success('Hủy đơn thành công')
      setShowCancel(false)
      queryClient.invalidateQueries(['booking', id])
      queryClient.invalidateQueries(['my-bookings'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Hủy đơn thất bại'),
  })

  // ── Thanh toán lại ────────────────────────────────────
  const handleRepay = async () => {
    if (!booking) return
    setRepaying(true)
    try {
      if (booking.paymentMethod === 'VNPAY') {
        const res = await paymentApi.createVNPay(booking.id)
        const url = res.data?.data?.paymentUrl
        if (url) { window.location.href = url; return }
      }
      if (booking.paymentMethod === 'MOMO') {
        const res = await paymentApi.createMoMo(booking.id)
        const url = res.data?.data?.paymentUrl
        if (url) { window.location.href = url; return }
      }
      toast.error('Không thể tạo URL thanh toán')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi kết nối cổng thanh toán')
    } finally {
      setRepaying(false)
    }
  }

  if (isLoading) return <PageLoader />
  if (!booking)  return (
    <MainLayout>
      <div className="text-center py-20 text-primary-muted">Không tìm thấy đơn đặt xe</div>
    </MainLayout>
  )

  const statusCfg   = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CANCELLED
  const pmCfg       = PAYMENT_LABEL[booking.paymentMethod]
  const canCancel   = isCustomer && ['PENDING_PAYMENT', 'PENDING_CONFIRM', 'CONFIRMED'].includes(booking.status)
  const needRepay   = booking.status === 'PENDING_PAYMENT' && booking.paymentMethod !== 'CASH'

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 pb-8">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-primary-muted hover:text-primary
                     transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Quay lại
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-1">Chi tiết đơn</h1>
            <span className="font-mono text-sm text-primary-subtle bg-surface-muted
                             px-2.5 py-1 rounded-lg">
              #{booking.id}
            </span>
          </div>
          <span className={`flex items-center gap-2 text-sm font-semibold px-3.5 py-2
                            rounded-xl border shrink-0 ${statusCfg.cls}`}>
            {statusCfg.icon}
            {statusCfg.label}
          </span>
        </div>

        {/* Status banner */}
        <div className={`rounded-2xl p-4 mb-6 border ${
          booking.status === 'COMPLETED' ? 'bg-green-50 border-green-200' :
          booking.status === 'CANCELLED' ? 'bg-gray-50 border-gray-200' :
          booking.status === 'REFUNDED'  ? 'bg-purple-50 border-purple-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <p className="text-sm leading-relaxed text-primary-muted">{statusCfg.desc}</p>

          {/* Confirm deadline */}
          {booking.status === 'PENDING_CONFIRM' && booking.confirmDeadline && (
            <p className="text-xs text-amber-600 font-semibold mt-2">
              ⏰ Hạn xác nhận: {new Date(booking.confirmDeadline).toLocaleTimeString('vi-VN', {
                hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit',
              })}
            </p>
          )}

          {/* Cancel reason */}
          {booking.cancelReason && (
            <p className="text-sm text-red-600 mt-2 font-medium">
              Lý do: {booking.cancelReason}
            </p>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-surface border border-border rounded-2xl p-5 mb-5 overflow-x-auto">
          <StatusTimeline status={booking.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* ── Cột trái ──────────────────────────────── */}
          <div className="space-y-5">

            {/* Xe */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="h-36 bg-surface-muted overflow-hidden">
                {booking.carImageUrl ? (
                  <img src={booking.carImageUrl} alt={booking.carName}
                       className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-8 h-8 text-primary-subtle opacity-30" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-primary mb-1">{booking.carName}</h3>
                <div className="flex items-center gap-1 text-xs text-primary-subtle mb-3">
                  <MapPin className="w-3 h-3 text-teal-400" />
                  {booking.province}
                </div>
                <button
                  onClick={() => navigate(`/cars/${booking.carId}`)}
                  className="btn-secondary w-full py-2 text-sm flex items-center
                             justify-center gap-1"
                >
                  Xem xe <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Host info */}
            {booking.host && (
              <div className="bg-surface border border-border rounded-2xl p-4">
                <h3 className="text-sm font-bold text-primary mb-3">Thông tin chủ xe</h3>
                <div className="flex items-center gap-3">
                  {booking.host.avatarUrl ? (
                    <img src={booking.host.avatarUrl}
                         className="w-10 h-10 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100
                                    flex items-center justify-center text-teal-600 font-bold">
                      {booking.host.fullName?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-primary text-sm">{booking.host.fullName}</p>
                    {booking.host.phone && (
                      <a href={`tel:${booking.host.phone}`}
                         className="flex items-center gap-1 text-xs text-teal-600 mt-0.5
                                    hover:text-teal-800 transition-colors">
                        <Phone className="w-3 h-3" />
                        {booking.host.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Cột phải ──────────────────────────────── */}
          <div className="space-y-5">

            {/* Thông tin chuyến */}
            <div className="bg-surface border border-border rounded-2xl p-4">
              <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" /> Thông tin chuyến
              </h3>
              <div>
                <InfoRow label="Ngày nhận xe"  value={booking.startDate} />
                <InfoRow label="Ngày trả xe"   value={booking.endDate} />
                <InfoRow label="Số ngày thuê"  value={`${booking.totalDays} ngày`} />
                <InfoRow label="Giá thuê/ngày"
                  value={`${Number(booking.pricePerDay).toLocaleString('vi-VN')}đ`} />
                {Number(booking.depositAmount) > 0 && (
                  <InfoRow label="Tiền cọc"
                    value={`${Number(booking.depositAmount).toLocaleString('vi-VN')}đ`} />
                )}
                <div className="flex justify-between items-start py-2.5">
                  <span className="text-sm font-bold text-primary">Tổng cộng</span>
                  <span className="text-base font-bold text-teal-600">
                    {Number(booking.totalPrice).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>

            {/* Thông tin người lái */}
            <div className="bg-surface border border-border rounded-2xl p-4">
              <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" /> Người lái xe
              </h3>
              <InfoRow label="Họ tên"      value={booking.driverName} />
              <div className="flex justify-between items-start py-2.5 border-b border-border">
                <span className="text-sm text-primary-muted flex items-center gap-1">
                  <IdCard className="w-3.5 h-3.5" /> CMND/CCCD
                </span>
                <span className="text-sm font-mono font-medium text-primary">
                  {booking.driverIdCard}
                </span>
              </div>
              <div className="flex justify-between items-start py-2.5">
                <span className="text-sm text-primary-muted flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> SĐT
                </span>
                <a href={`tel:${booking.driverPhone}`}
                   className="text-sm font-medium text-teal-600 hover:text-teal-800">
                  {booking.driverPhone}
                </a>
              </div>
            </div>

            {/* Thanh toán */}
            <div className="bg-surface border border-border rounded-2xl p-4">
              <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-600" /> Thanh toán
              </h3>
              <div className="flex items-center gap-2 mb-3">
                {pmCfg && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pmCfg.cls}`}>
                    {pmCfg.icon}
                    <span className="text-sm font-semibold">{pmCfg.label}</span>
                  </div>
                )}
              </div>
              {payment && (
                <div className="space-y-1">
                  <InfoRow label="Mã GD"
                    value={<span className="font-mono text-xs">{payment.transactionId}</span>} />
                  <InfoRow label="Trạng thái"
                    value={payment.status === 'SUCCESS' ? '✅ Thành công' :
                           payment.status === 'FAILED'  ? '❌ Thất bại'  : '⏳ Chờ xử lý'} />
                  {payment.paidAt && (
                    <InfoRow label="Thời gian"
                      value={new Date(payment.paidAt).toLocaleString('vi-VN')} />
                  )}
                </div>
              )}
            </div>

            {/* Thời gian đặt */}
            <div className="text-xs text-primary-subtle text-right">
              Đặt lúc: {booking.createdAt
                ? new Date(booking.createdAt).toLocaleString('vi-VN')
                : '--'}
              {booking.confirmedAt && (
                <div>
                  Xác nhận lúc: {new Date(booking.confirmedAt).toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────── */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {/* Thanh toán lại (khi PENDING_PAYMENT và là VNPay/MoMo) */}
          {needRepay && (
            <button
              onClick={handleRepay}
              disabled={repaying}
              className="flex-1 btn-teal py-3 flex items-center justify-center gap-2 text-base"
            >
              {repaying
                ? <><LoadingSpinner size="sm" /> Đang chuyển hướng...</>
                : <><CreditCard className="w-4 h-4" /> Thanh toán ngay</>
              }
            </button>
          )}

          {/* Hủy đơn */}
          {canCancel && (
            <button
              onClick={() => setShowCancel(true)}
              className="flex-1 btn-danger py-3 flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Hủy đơn
            </button>
          )}

          {/* Đánh giá (sau khi hoàn thành) */}
          {booking.status === 'COMPLETED' && isCustomer && (
            <button
              onClick={() => navigate(`/bookings/${id}/review`)}
              className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
            >
              ⭐ Đánh giá chuyến đi
            </button>
          )}
        </div>

      </div>

      {/* Modal hủy */}
      {showCancel && (
        <CancelModal
          booking={booking}
          loading={cancelMutation.isPending}
          onConfirm={(reason) => cancelMutation.mutate({ id: booking.id, reason })}
          onClose={() => setShowCancel(false)}
        />
      )}
    </MainLayout>
  )
}