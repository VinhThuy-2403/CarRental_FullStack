import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, ArrowRight, Home } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { bookingApi } from '@/api/bookingApi'
import MainLayout from '@/components/layout/MainLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()

  const status    = searchParams.get('status')    // 'success' | 'failed'
  const bookingId = searchParams.get('bookingId')

  const isSuccess = status === 'success'

  // Fetch booking detail để hiện thông tin
  const { data: res, isLoading } = useQuery({
    queryKey: ['booking-result', bookingId],
    queryFn:  () => bookingApi.getDetail(bookingId),
    enabled:  !!bookingId && isSuccess,
    retry: 3,
  })
  const booking = res?.data?.data

  // Auto redirect sau 10 giây nếu thành công
  const [countdown, setCountdown] = useState(10)
  useEffect(() => {
    if (!isSuccess) return
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          navigate(`/bookings/${bookingId}`)
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isSuccess, bookingId, navigate])

  return (
    <MainLayout>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* ── Thành công ──────────────────────────── */}
          {isSuccess ? (
            <div className="text-center animate-slide-up">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center
                              mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-teal-600" />
              </div>
              <h1 className="text-2xl font-bold text-primary mb-2">Thanh toán thành công!</h1>
              <p className="text-primary-muted mb-6">
                Đơn đặt xe của bạn đã được ghi nhận.
                Host sẽ xác nhận trong vòng <span className="font-semibold text-primary">2 giờ</span>.
              </p>

              {/* Booking info */}
              {isLoading ? (
                <div className="flex justify-center mb-6"><LoadingSpinner /></div>
              ) : booking ? (
                <div className="bg-surface border border-border rounded-2xl p-5 text-left mb-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-muted">Mã đơn</span>
                    <span className="font-mono font-bold text-primary">#{booking.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-muted">Xe</span>
                    <span className="font-semibold text-primary">{booking.carName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-muted">Ngày thuê</span>
                    <span className="font-semibold text-primary">
                      {booking.startDate} → {booking.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-border pt-3">
                    <span className="text-primary-muted">Đã thanh toán</span>
                    <span className="font-bold text-teal-600 text-base">
                      {Number(booking.totalPrice).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-muted">Trạng thái</span>
                    <span className="bg-teal-50 text-teal-600 border border-teal-100
                                     text-xs font-semibold px-2.5 py-1 rounded-full">
                      Chờ Host xác nhận
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Lưu ý */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left mb-6">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Bước tiếp theo</p>
                    <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                      Host có 2 giờ để xác nhận đơn. Bạn sẽ nhận thông báo khi đơn được xác nhận hoặc từ chối.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  to={`/bookings/${bookingId}`}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base"
                >
                  Xem chi tiết đơn <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/cars" className="btn-secondary w-full py-3 text-center text-sm">
                  Tiếp tục tìm xe khác
                </Link>
              </div>

              <p className="text-xs text-primary-subtle mt-4">
                Tự chuyển sang chi tiết đơn sau <span className="font-semibold">{countdown}s</span>
              </p>
            </div>

          ) : (
            /* ── Thất bại ──────────────────────────────*/
            <div className="text-center animate-slide-up">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center
                              mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-primary mb-2">Thanh toán thất bại</h1>
              <p className="text-primary-muted mb-6">
                Giao dịch không thành công. Đơn đặt xe của bạn chưa được xác nhận.
                Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
              </p>

              <div className="flex flex-col gap-3">
                {bookingId && (
                  <Link
                    to={`/bookings/${bookingId}`}
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                  >
                    Thử thanh toán lại
                  </Link>
                )}
                <Link to="/" className="btn-secondary w-full py-3 flex items-center
                                         justify-center gap-2 text-sm">
                  <Home className="w-4 h-4" /> Về trang chủ
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}