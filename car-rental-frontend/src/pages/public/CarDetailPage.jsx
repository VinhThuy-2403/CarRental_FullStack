import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Star, Users, Fuel, Settings, ChevronLeft, ChevronRight, Shield } from 'lucide-react'
import { carApi } from '@/api/carApi'
import MainLayout from '@/components/layout/MainLayout'
import { PageLoader } from '@/components/common/LoadingSpinner'
import useAuthStore from '@/store/authStore'

const FUEL_LABEL = { GASOLINE:'Xăng', DIESEL:'Dầu', ELECTRIC:'Điện', HYBRID:'Hybrid' }
const TRANS_LABEL = { AUTOMATIC:'Số tự động', MANUAL:'Số sàn' }
const MONTH_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']

export default function CarDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { isLoggedIn } = useAuthStore()
  const [imgIdx, setImgIdx]    = useState(0)
  const [calDate, setCalDate]  = useState(new Date())

  const { data: carRes, isLoading } = useQuery({
    queryKey: ['car', id],
    queryFn: () => carApi.getDetail(id),
  })
  const { data: calRes } = useQuery({
    queryKey: ['car-availability', id, calDate.getFullYear(), calDate.getMonth() + 1],
    queryFn: () => carApi.getAvailability(id, calDate.getFullYear(), calDate.getMonth() + 1),
  })

  if (isLoading) return <PageLoader />

  const car  = carRes?.data?.data
  const days = calRes?.data?.data || []
  if (!car)  return <div className="p-8 text-center">Không tìm thấy xe</div>

  const images     = car.images || []
  const prevImg    = () => setImgIdx((i) => (i - 1 + images.length) % images.length)
  const nextImg    = () => setImgIdx((i) => (i + 1) % images.length)
  const prevMonth  = () => setCalDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth  = () => setCalDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const handleBook = () => {
    if (!isLoggedIn) { navigate('/login', { state: { from: `/cars/${id}` } }); return }
    navigate(`/booking/${id}`)
  }

  // Build calendar grid
  const firstDay  = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay()
  const offset    = firstDay === 0 ? 6 : firstDay - 1 // Mon start
  const dayMap    = Object.fromEntries(days.map((d) => [d.date, d]))

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 pb-32">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-primary-muted hover:text-primary
                     transition-colors mb-5">
          <ChevronLeft className="w-4 h-4" /> Quay lại
        </button>

        {/* Image gallery */}
        <div className="relative rounded-2xl overflow-hidden bg-surface-muted mb-6 h-72 sm:h-96">
          {images.length > 0 ? (
            <>
              <img src={images[imgIdx]?.url} alt={car.fullName}
                   className="w-full h-full object-cover" />
              {images.length > 1 && (
                <>
                  <button onClick={prevImg}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9
                               bg-white/90 rounded-full flex items-center justify-center
                               hover:bg-white transition-colors shadow-card">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={nextImg}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9
                               bg-white/90 rounded-full flex items-center justify-center
                               hover:bg-white transition-colors shadow-card">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setImgIdx(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === imgIdx ? 'bg-white w-4' : 'bg-white/50'
                        }`} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary-subtle">Chưa có ảnh</div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button key={i} onClick={() => setImgIdx(i)}
                className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === imgIdx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                }`}>
                <img src={img.url} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary mb-2">{car.fullName}</h1>
          <div className="flex items-center gap-1.5 text-sm text-primary-subtle mb-4">
            <MapPin className="w-4 h-4 text-teal-400" />
            {car.district ? `${car.district}, ` : ''}{car.province}
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { icon: <Users className="w-4 h-4" />, val: `${car.seats} chỗ` },
              { icon: <Settings className="w-4 h-4" />, val: TRANS_LABEL[car.transmission] },
              { icon: <Fuel className="w-4 h-4" />, val: FUEL_LABEL[car.fuelType] },
              { icon: <Shield className="w-4 h-4" />, val: `${car.kmLimitPerDay} km/ngày` },
            ].map((spec, i) => (
              <div key={i} className="flex items-center gap-2 bg-surface-soft rounded-xl p-3">
                <span className="text-teal-600">{spec.icon}</span>
                <span className="text-sm font-semibold text-primary">{spec.val}</span>
              </div>
            ))}
          </div>

          {/* Features */}
          {car.features?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {car.features.map((f) => (
                <span key={f} className="bg-surface-muted border border-border text-primary-muted
                                         text-xs font-medium px-3 py-1.5 rounded-full">
                  {f}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {car.description && (
            <div className="mb-5">
              <h2 className="text-base font-bold text-primary mb-2">Mô tả xe</h2>
              <p className="text-sm text-primary-muted leading-relaxed whitespace-pre-line">
                {car.description}
              </p>
            </div>
          )}
        </div>

        {/* Host info */}
        <div className="bg-surface-soft border border-border rounded-2xl p-4 mb-6">
          <h2 className="text-base font-bold text-primary mb-3">Chủ xe</h2>
          <div className="flex items-center gap-3">
            {car.host?.avatarUrl ? (
              <img src={car.host.avatarUrl} className="w-12 h-12 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-100
                              flex items-center justify-center text-teal-600 text-lg font-bold">
                {car.host?.fullName?.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-semibold text-primary">{car.host?.fullName}</div>
              {car.host?.totalCompletedBookings > 0 && (
                <div className="text-xs text-primary-subtle flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {car.host.avgRating} · {car.host.totalCompletedBookings} chuyến hoàn thành
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Availability calendar */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-primary mb-3">Lịch xe</h2>
          <div className="bg-surface border border-border rounded-2xl p-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg
                           hover:bg-surface-soft transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-primary">
                {MONTH_VI[calDate.getMonth()]} {calDate.getFullYear()}
              </span>
              <button onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg
                           hover:bg-surface-soft transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-2">
              {['T2','T3','T4','T5','T6','T7','CN'].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-primary-subtle py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
              {days.map((day) => {
                const status = day.status
                const isPast = new Date(day.date) < new Date(new Date().toDateString())
                return (
                  <div key={day.date}
                    className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium
                                transition-colors ${
                      isPast            ? 'text-primary-subtle/40' :
                      status === 'BOOKED'   ? 'bg-teal-50 text-teal-600' :
                      status === 'BLOCKED'  ? 'bg-surface-muted text-primary-subtle line-through' :
                      'text-primary hover:bg-surface-soft'
                    }`}>
                    {new Date(day.date).getDate()}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
              {[['bg-surface', 'Còn trống'], ['bg-teal-50', 'Đã đặt'], ['bg-surface-muted', 'Không khả dụng']].map(([cls, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${cls} border border-border`} />
                  <span className="text-xs text-primary-subtle">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md
                      border-t border-border px-4 py-3 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-primary">
                {car.pricePerDay?.toLocaleString('vi-VN')}đ
              </span>
              <span className="text-sm text-primary-subtle">/ngày</span>
            </div>
            {car.deposit > 0 && (
              <div className="text-xs text-primary-subtle">
                Cọc: {car.deposit?.toLocaleString('vi-VN')}đ
              </div>
            )}
          </div>
          <button onClick={handleBook} className="btn-primary px-8 py-3 text-base">
            Đặt xe ngay
          </button>
        </div>
      </div>
    </MainLayout>
  )
}