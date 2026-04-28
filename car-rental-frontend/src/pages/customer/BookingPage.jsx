import { useState, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  MapPin, Calendar, Users, Fuel, Settings,
  CreditCard, Wallet, Banknote, ChevronLeft,
  AlertCircle, Shield, Loader,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { carApi } from '@/api/carApi'
import { bookingApi } from '@/api/bookingApi'
import { paymentApi } from '@/api/paymentApi'
import MainLayout from '@/components/layout/MainLayout'
import { PageLoader } from '@/components/common/LoadingSpinner'
import useAuthStore from '@/store/authStore'

// ─── Schema ───────────────────────────────────────────
const schema = z.object({
  driverName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(100),
  driverIdCard: z.string()
    .min(9, 'CMND/CCCD phải từ 9-12 số').max(12, 'CMND/CCCD phải từ 9-12 số')
    .regex(/^\d+$/, 'Chỉ nhập số'),
  driverPhone: z.string()
    .regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không hợp lệ'),
  paymentMethod: z.enum(['VNPAY', 'MOMO', 'CASH']),
})

// ─── Payment method config ────────────────────────────
const PAYMENT_METHODS = [
  {
    value: 'VNPAY',
    label: 'VNPay',
    desc: 'Chuyển khoản ngân hàng, QR Code',
    icon: <CreditCard className="w-5 h-5" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    value: 'MOMO',
    label: 'MoMo',
    desc: 'Ví điện tử MoMo',
    icon: <Wallet className="w-5 h-5" />,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
  },
  {
    value: 'CASH',
    label: 'Tiền mặt',
    desc: 'Thanh toán khi nhận xe',
    icon: <Banknote className="w-5 h-5" />,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
]

const FUEL_LABEL  = { GASOLINE: 'Xăng', DIESEL: 'Dầu', ELECTRIC: 'Điện', HYBRID: 'Hybrid' }
const TRANS_LABEL = { AUTOMATIC: 'Tự động', MANUAL: 'Số sàn' }

const inputCls = `w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-teal-400/25
                  focus:border-teal-400 transition-all`
const labelCls = 'block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5'

// ─── Page ─────────────────────────────────────────────
export default function BookingPage() {
  const { carId }  = useParams()
  const navigate   = useNavigate()
  const [searchParams] = useSearchParams()
  const { user }   = useAuthStore()

  // Lấy ngày từ URL nếu được truyền từ CarDetailPage
  const initStart  = searchParams.get('startDate') || ''
  const initEnd    = searchParams.get('endDate')   || ''

  const [startDate, setStartDate] = useState(initStart)
  const [endDate,   setEndDate]   = useState(initEnd)
  const [step,      setStep]      = useState(1) // 1: form, 2: xác nhận
  const [booking,   setBooking]   = useState(null) // đơn vừa tạo
  const [paying,    setPaying]    = useState(false)

  // ── Fetch car ────────────────────────────────────────
  const { data: carRes, isLoading } = useQuery({
    queryKey: ['car', carId],
    queryFn:  () => carApi.getDetail(carId),
  })
  const car = carRes?.data?.data

  // ── Tính toán ────────────────────────────────────────
  const { totalDays, totalPrice, depositAmount } = useMemo(() => {
    if (!startDate || !endDate || !car) return { totalDays: 0, totalPrice: 0, depositAmount: 0 }
    const s = new Date(startDate)
    const e = new Date(endDate)
    if (e <= s) return { totalDays: 0, totalPrice: 0, depositAmount: 0 }
    const days    = Math.ceil((e - s) / (1000 * 60 * 60 * 24))
    const deposit = Number(car.deposit || 0)
    const price   = Number(car.pricePerDay || 0) * days + deposit
    return { totalDays: days, totalPrice: price, depositAmount: deposit }
  }, [startDate, endDate, car])

  // ── Form ─────────────────────────────────────────────
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      driverName:    user?.fullName || '',
      driverIdCard:  '',
      driverPhone:   user?.phone    || '',
      paymentMethod: 'VNPAY',
    },
  })
  const paymentMethod = watch('paymentMethod')

  // ── Mutations ────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => bookingApi.create({
      carId:         Number(carId),
      startDate,
      endDate,
      driverName:    data.driverName,
      driverIdCard:  data.driverIdCard,
      driverPhone:   data.driverPhone,
      paymentMethod: data.paymentMethod,
    }),
    onSuccess: (res) => {
      setBooking(res.data?.data)
      setStep(2)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Đặt xe thất bại. Vui lòng thử lại.')
    },
  })

  // ── Xử lý thanh toán sau khi tạo đơn ────────────────
  const handlePay = async () => {
    if (!booking) return
    setPaying(true)
    try {
      if (booking.paymentMethod === 'CASH') {
        // Tiền mặt: không cần redirect, báo thành công luôn
        toast.success('Đặt xe thành công! Vui lòng đến nhận xe và thanh toán trực tiếp.')
        navigate(`/bookings/${booking.id}`)
        return
      }
      if (booking.paymentMethod === 'VNPAY') {
        const res = await paymentApi.createVNPay(booking.id)
        const url = res.data?.data?.paymentUrl
        if (url) { window.location.href = url; return }
        throw new Error('Không lấy được URL thanh toán VNPay')
      }
      if (booking.paymentMethod === 'MOMO') {
        const res = await paymentApi.createMoMo(booking.id)
        const url = res.data?.data?.paymentUrl
        if (url) { window.location.href = url; return }
        throw new Error('Không lấy được URL thanh toán MoMo')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi kết nối cổng thanh toán')
    } finally {
      setPaying(false)
    }
  }

  if (isLoading) return <PageLoader />
  if (!car) return (
    <MainLayout>
      <div className="text-center py-20 text-primary-muted">Không tìm thấy xe</div>
    </MainLayout>
  )

  const today = new Date().toISOString().split('T')[0]

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 pb-8">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-primary-muted hover:text-primary
                     transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Quay lại
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {[['1', 'Thông tin'], ['2', 'Xác nhận & Thanh toán']].map(([num, label], i) => (
            <div key={num} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                               transition-all ${
                step > i ? 'bg-teal-600 text-white' :
                step === i + 1 ? 'bg-primary text-white' :
                'bg-surface-muted text-primary-subtle'
              }`}>
                {step > i + 1 ? '✓' : num}
              </div>
              <span className={`text-sm font-medium ${step === i + 1 ? 'text-primary' : 'text-primary-subtle'}`}>
                {label}
              </span>
              {i === 0 && <div className="w-8 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left: Form / Confirm ──────────────────── */}
          <div className="lg:col-span-3 space-y-5">

            {/* ─── Step 1: Form ───────────────────────── */}
            {step === 1 && (
              <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-5">

                {/* Chọn ngày */}
                <div className="bg-surface border border-border rounded-2xl p-5">
                  <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600" /> Chọn ngày thuê
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Ngày nhận xe</label>
                      <input
                        type="date"
                        value={startDate}
                        min={today}
                        onChange={(e) => {
                          setStartDate(e.target.value)
                          if (endDate && e.target.value >= endDate) setEndDate('')
                        }}
                        className={inputCls}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Ngày trả xe</label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || today}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={inputCls}
                        required
                      />
                    </div>
                  </div>
                  {totalDays > 0 && (
                    <div className="mt-3 bg-teal-50 border border-teal-100 rounded-xl px-4 py-2.5
                                    flex items-center justify-between">
                      <span className="text-sm text-teal-700">
                        Tổng cộng <span className="font-bold">{totalDays} ngày</span>
                      </span>
                      <span className="text-sm font-bold text-teal-700">
                        {(Number(car.pricePerDay) * totalDays).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  )}
                </div>

                {/* Thông tin người lái */}
                <div className="bg-surface border border-border rounded-2xl p-5">
                  <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" /> Thông tin người lái xe
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Họ và tên người lái</label>
                      <input {...register('driverName')}
                             placeholder="Nguyễn Văn A" className={inputCls} />
                      {errors.driverName && (
                        <p className="text-red-500 text-xs mt-1">{errors.driverName.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>CMND / CCCD</label>
                        <input {...register('driverIdCard')}
                               placeholder="012345678901" className={inputCls} maxLength={12} />
                        {errors.driverIdCard && (
                          <p className="text-red-500 text-xs mt-1">{errors.driverIdCard.message}</p>
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>Số điện thoại</label>
                        <input {...register('driverPhone')}
                               placeholder="0912345678" className={inputCls} />
                        {errors.driverPhone && (
                          <p className="text-red-500 text-xs mt-1">{errors.driverPhone.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phương thức thanh toán */}
                <div className="bg-surface border border-border rounded-2xl p-5">
                  <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-teal-600" /> Phương thức thanh toán
                  </h2>
                  <div className="space-y-3">
                    {PAYMENT_METHODS.map((m) => (
                      <label key={m.value}
                             className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer
                                         transition-all duration-150 ${
                               paymentMethod === m.value
                                 ? 'border-primary bg-surface-soft'
                                 : 'border-border hover:border-border-strong'
                             }`}>
                        <input {...register('paymentMethod')} type="radio"
                               value={m.value} className="sr-only" />
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                         shrink-0 ${m.bg} ${m.color}`}>
                          {m.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-primary">{m.label}</p>
                          <p className="text-xs text-primary-subtle">{m.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                         shrink-0 transition-all ${
                          paymentMethod === m.value
                            ? 'border-primary bg-primary'
                            : 'border-border'
                        }`}>
                          {paymentMethod === m.value && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.paymentMethod && (
                    <p className="text-red-500 text-xs mt-2">{errors.paymentMethod.message}</p>
                  )}
                </div>

                {/* Chính sách hủy */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800 mb-1">Chính sách hủy đơn</p>
                      <ul className="text-xs text-amber-700 space-y-0.5 leading-relaxed">
                        <li>• Hủy trước 24h: hoàn 100% tiền cọc</li>
                        <li>• Hủy trong vòng 24h: hoàn 50% tiền cọc</li>
                        <li>• Hoàn tiền trong 3–5 ngày làm việc</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createMutation.isPending || totalDays === 0}
                  className="w-full btn-primary py-3.5 text-base flex items-center
                             justify-center gap-2 disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader className="w-4 h-4 animate-spin" />}
                  {createMutation.isPending ? 'Đang xử lý...' : 'Tiếp tục →'}
                </button>
              </form>
            )}

            {/* ─── Step 2: Xác nhận & Thanh toán ─────── */}
            {step === 2 && booking && (
              <div className="space-y-5 animate-fade-in">
                <div className="bg-surface border border-border rounded-2xl p-5">
                  <h2 className="text-base font-bold text-primary mb-4">Xác nhận thông tin đơn</h2>

                  {/* Chi tiết đơn */}
                  <div className="space-y-3">
                    {[
                      ['Ngày nhận xe', booking.startDate],
                      ['Ngày trả xe',  booking.endDate],
                      ['Số ngày thuê', `${booking.totalDays} ngày`],
                      ['Người lái',    booking.driverName],
                      ['CMND/CCCD',    booking.driverIdCard],
                      ['SĐT người lái', booking.driverPhone],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-sm
                                               py-2 border-b border-border last:border-0">
                        <span className="text-primary-muted">{k}</span>
                        <span className="font-semibold text-primary">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phương thức TT đã chọn */}
                <div className="bg-surface border border-border rounded-2xl p-5">
                  <p className="text-sm text-primary-muted mb-2">Thanh toán qua</p>
                  {(() => {
                    const m = PAYMENT_METHODS.find(p => p.value === booking.paymentMethod)
                    return m ? (
                      <div className={`flex items-center gap-3 p-3 rounded-xl ${m.bg}`}>
                        <div className={`${m.color}`}>{m.icon}</div>
                        <div>
                          <p className={`text-sm font-bold ${m.color}`}>{m.label}</p>
                          <p className="text-xs text-primary-subtle">{m.desc}</p>
                        </div>
                      </div>
                    ) : null
                  })()}
                </div>

                {/* Chú ý */}
                {booking.paymentMethod === 'CASH' && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                    <p className="text-sm text-teal-800 font-semibold mb-1">Thanh toán tiền mặt</p>
                    <p className="text-xs text-teal-700 leading-relaxed">
                      Đơn sẽ được gửi đến Host để xác nhận. Bạn thanh toán trực tiếp khi đến nhận xe.
                      Host sẽ xác nhận nhận tiền trên hệ thống.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handlePay}
                    disabled={paying}
                    className="flex-1 btn-teal py-3.5 text-base flex items-center
                               justify-center gap-2 disabled:opacity-50"
                  >
                    {paying && <Loader className="w-4 h-4 animate-spin" />}
                    {paying ? 'Đang chuyển hướng...' :
                      booking.paymentMethod === 'CASH' ? 'Xác nhận đặt xe' :
                      `Thanh toán qua ${PAYMENT_METHODS.find(m => m.value === booking.paymentMethod)?.label}`
                    }
                  </button>
                  <button
                    onClick={() => { setStep(1); setBooking(null) }}
                    className="btn-secondary px-5 py-3.5"
                  >
                    Quay lại
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Summary card ───────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-surface border border-border rounded-2xl overflow-hidden sticky top-20">
              {/* Ảnh xe */}
              <div className="h-40 bg-surface-muted overflow-hidden">
                {car.images?.[0]?.url ? (
                  <img src={car.images[0].url} alt={car.fullName}
                       className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-primary-subtle text-sm">Chưa có ảnh</span>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-4">
                {/* Tên xe */}
                <div>
                  <h3 className="font-bold text-primary text-base">{car.fullName}</h3>
                  <div className="flex items-center gap-1 text-xs text-primary-subtle mt-0.5">
                    <MapPin className="w-3 h-3 text-teal-400" />
                    {car.province}
                  </div>
                </div>

                {/* Specs nhỏ */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    [<Users className="w-3 h-3" />, `${car.seats} chỗ`],
                    [<Settings className="w-3 h-3" />, TRANS_LABEL[car.transmission]],
                    [<Fuel className="w-3 h-3" />, FUEL_LABEL[car.fuelType]],
                    [<Shield className="w-3 h-3" />, `${car.kmLimitPerDay} km/ngày`],
                  ].map(([icon, val], i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-primary-muted">
                      <span className="text-teal-500">{icon}</span>{val}
                    </div>
                  ))}
                </div>

                {/* Bảng giá */}
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-muted">
                      {Number(car.pricePerDay).toLocaleString('vi-VN')}đ × {totalDays || '--'} ngày
                    </span>
                    <span className="font-semibold text-primary">
                      {totalDays > 0
                        ? (Number(car.pricePerDay) * totalDays).toLocaleString('vi-VN') + 'đ'
                        : '--'}
                    </span>
                  </div>
                  {Number(car.deposit) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-muted">Tiền đặt cọc</span>
                      <span className="font-semibold text-primary">
                        {Number(car.deposit).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                    <span className="text-primary">Tổng cộng</span>
                    <span className="text-teal-600">
                      {totalDays > 0 ? totalPrice.toLocaleString('vi-VN') + 'đ' : '--'}
                    </span>
                  </div>
                </div>

                {/* Bảo vệ */}
                <div className="flex items-center gap-2 text-xs text-primary-subtle bg-surface-soft
                                rounded-xl px-3 py-2.5">
                  <Shield className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  Giao dịch được bảo mật bởi XeGo
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}