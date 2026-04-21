import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, ChevronRight, Car } from 'lucide-react'
import { carApi } from '@/api/carApi'
import HostLayout from '@/components/layout/HostLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const STATUS_BADGE = {
  PENDING:  { label: 'Chờ duyệt', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  APPROVED: { label: 'Đang hoạt động', cls: 'bg-teal-50 text-teal-600 border-teal-100' },
  REJECTED: { label: 'Bị từ chối', cls: 'bg-red-50 text-red-600 border-red-200' },
  INACTIVE: { label: 'Ẩn', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
}

export default function CalendarSelectPage() {
  const navigate = useNavigate()

  const { data: res, isLoading } = useQuery({
    queryKey: ['my-cars'],
    queryFn:  () => carApi.getMyCars(),
  })

  const cars = res?.data?.data || []
  // Chỉ hiện xe đang hoạt động hoặc pending (có thể cần xem lịch)
  const activeCars = cars.filter((c) => ['APPROVED', 'INACTIVE'].includes(c.status))

  return (
    <HostLayout>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-1">Quản lý lịch xe</h1>
          <p className="text-primary-muted text-sm">
            Chọn xe để xem và quản lý lịch đặt
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : activeCars.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-12 text-center">
            <Car className="w-12 h-12 text-primary-subtle mx-auto mb-3 opacity-40" />
            <p className="font-medium text-primary mb-1">Chưa có xe nào để quản lý lịch</p>
            <p className="text-sm text-primary-subtle mb-5">
              Bạn cần có xe được duyệt để quản lý lịch
            </p>
            <button
              onClick={() => navigate('/host/cars')}
              className="btn-primary px-5 py-2 text-sm"
            >
              Xem danh sách xe
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeCars.map((car) => {
              const badge = STATUS_BADGE[car.status]
              return (
                <button
                  key={car.id}
                  onClick={() => navigate(`/host/calendar/${car.id}`)}
                  className="w-full bg-surface border border-border rounded-2xl p-4
                             hover:shadow-card hover:border-teal-200 transition-all duration-200
                             flex items-center gap-4 text-left group"
                >
                  {/* Ảnh xe */}
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-surface-muted shrink-0">
                    {car.primaryImageUrl ? (
                      <img src={car.primaryImageUrl} alt={car.fullName}
                           className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-6 h-6 text-primary-subtle opacity-40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-primary truncate mb-1">{car.fullName}</p>
                    <p className="text-xs text-primary-subtle mb-2">{car.province}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Calendar className="w-4 h-4 text-teal-400" />
                    <ChevronRight className="w-5 h-5 text-primary-subtle
                                             group-hover:text-teal-600 transition-colors" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </HostLayout>
  )
}