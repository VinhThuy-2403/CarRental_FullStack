import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, MapPin, Calendar, Car, Shield, Star, ChevronRight } from 'lucide-react'
import { carApi } from '@/api/carApi'
import CarCard, { CarCardSkeleton } from '@/components/car/CarCard'
import MainLayout from '@/components/layout/MainLayout'

const PROVINCES = ['Hà Nội','TP. Hồ Chí Minh','Đà Nẵng','Nha Trang','Đà Lạt','Vũng Tàu']

export default function HomePage() {
  const navigate  = useNavigate()
  const [province, setProvince]   = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')

  const { data: featuredRes, isLoading } = useQuery({
    queryKey: ['featured-cars'],
    queryFn: () => carApi.getFeatured(6),
  })
  const featured = featuredRes?.data?.data || []

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (province)  params.set('province', province)
    if (startDate) params.set('startDate', startDate)
    if (endDate)   params.set('endDate', endDate)
    navigate(`/cars?${params.toString()}`)
  }

  return (
    <MainLayout>
      {/* ── Hero ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-16">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-600
                          text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
            Nền tảng thuê xe uy tín #1 Việt Nam
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-primary leading-tight
                         tracking-tight mb-4">
            Thuê xe tự lái<br />
            <span className="text-teal-600">dễ dàng & an toàn</span>
          </h1>
          <p className="text-primary-muted text-lg leading-relaxed mb-10 max-w-xl">
            Hàng nghìn xe chất lượng cao, giá tốt từ các chủ xe uy tín.
            Đặt xe trong vài phút, nhận xe tận nơi.
          </p>
        </div>

        {/* Search box */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-card max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <SearchField label="Địa điểm" icon={<MapPin className="w-4 h-4" />}>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-primary
                           focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">Chọn tỉnh/thành</option>
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </SearchField>

            <SearchField label="Ngày nhận xe" icon={<Calendar className="w-4 h-4" />}>
              <input
                type="date"
                value={startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-primary
                           focus:outline-none cursor-pointer"
              />
            </SearchField>

            <SearchField label="Ngày trả xe" icon={<Calendar className="w-4 h-4" />}>
              <input
                type="date"
                value={endDate}
                min={startDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-primary
                           focus:outline-none cursor-pointer"
              />
            </SearchField>
          </div>
          <button
            onClick={handleSearch}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            <Search className="w-4 h-4" />
            Tìm xe ngay
          </button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-6 mt-8">
          {[['5,000+', 'Xe chất lượng'], ['50,000+', 'Chuyến thành công'], ['4.9★', 'Đánh giá TB']].map(([val, label]) => (
            <div key={label}>
              <div className="text-xl font-bold text-primary">{val}</div>
              <div className="text-xs text-primary-subtle">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Xe nổi bật ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary">Xe nổi bật</h2>
            <p className="text-sm text-primary-subtle mt-1">Được đặt nhiều và đánh giá cao nhất</p>
          </div>
          <button onClick={() => navigate('/cars')} className="btn-ghost flex items-center gap-1">
            Xem tất cả <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)
            : featured.map((car) => <CarCard key={car.id} car={car} />)
          }
        </div>
      </section>

      {/* ── Cách hoạt động ──────────────────────────── */}
      <section className="bg-surface-soft border-y border-border py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-primary text-center mb-2">Cách hoạt động</h2>
          <p className="text-primary-subtle text-center mb-10">Chỉ 3 bước đơn giản để có xe ngay</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Search className="w-6 h-6" />, step: '01', title: 'Tìm & chọn xe', desc: 'Tìm xe phù hợp với địa điểm, ngày thuê và ngân sách của bạn.' },
              { icon: <Calendar className="w-6 h-6" />, step: '02', title: 'Đặt & thanh toán', desc: 'Đặt xe an toàn qua VNPay, MoMo hoặc thanh toán khi nhận xe.' },
              { icon: <Car className="w-6 h-6" />, step: '03', title: 'Nhận xe & lên đường', desc: 'Gặp chủ xe, nhận xe và tận hưởng chuyến đi của bạn.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center
                                text-teal-600 mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-teal-400 tracking-widest mb-2">{item.step}</div>
                <h3 className="text-lg font-bold text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-primary-subtle leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tại sao chọn XeGo ───────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-primary text-center mb-10">Tại sao chọn XeGo?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: <Shield className="w-5 h-5" />, title: 'An toàn & Uy tín', desc: 'Xe được kiểm duyệt kỹ, chủ xe xác thực danh tính.' },
            { icon: <Star className="w-5 h-5" />, title: 'Chất lượng cao', desc: 'Hàng nghìn đánh giá thật từ khách hàng đã trải nghiệm.' },
            { icon: <Calendar className="w-5 h-5" />, title: 'Đặt dễ, hủy dễ', desc: 'Đặt xe trong vài phút, hủy trước 24h hoàn tiền đầy đủ.' },
            { icon: <Car className="w-5 h-5" />, title: 'Đa dạng lựa chọn', desc: 'Từ xe 4 chỗ đến 16 chỗ, phù hợp mọi nhu cầu.' },
          ].map((item) => (
            <div key={item.title} className="bg-surface border border-border rounded-2xl p-5
                                             hover:shadow-card transition-shadow duration-200">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center
                              text-teal-600 mb-4">
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-primary mb-1.5">{item.title}</h3>
              <p className="text-xs text-primary-subtle leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </MainLayout>
  )
}

function SearchField({ label, icon, children }) {
  return (
    <div className="bg-surface-soft border border-border rounded-xl p-3 hover:border-border-strong
                    transition-colors duration-150">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-primary-subtle">{icon}</span>
        <span className="text-xs font-semibold text-primary-subtle uppercase tracking-wider">
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}