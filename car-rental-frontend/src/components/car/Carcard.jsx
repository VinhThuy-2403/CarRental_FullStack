import { Heart, Star, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

const FUEL_LABEL = {
  GASOLINE: 'Xăng',
  DIESEL:   'Dầu diesel',
  ELECTRIC: 'Điện',
  HYBRID:   'Hybrid',
}
const TRANS_LABEL = {
  AUTOMATIC: 'Tự động',
  MANUAL:    'Số sàn',
}

export default function CarCard({ car }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/cars/${car.id}`)}
      className="bg-surface border border-border rounded-2xl overflow-hidden cursor-pointer
                 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 group"
    >
      {/* Ảnh xe */}
      <div className="relative h-48 bg-surface-muted overflow-hidden">
        {car.primaryImageUrl ? (
          <img
            src={car.primaryImageUrl}
            alt={car.fullName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-primary-subtle text-sm">Chưa có ảnh</span>
          </div>
        )}

        {/* Badge số chỗ */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm
                         text-primary text-xs font-semibold px-2.5 py-1 rounded-lg">
          {car.seats} chỗ
        </span>

        {/* Nút yêu thích */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm
                     rounded-full flex items-center justify-center
                     hover:bg-white transition-colors duration-150"
        >
          <Heart className="w-4 h-4 text-primary-muted" />
        </button>
      </div>

      {/* Thông tin xe */}
      <div className="p-4">
        <h3 className="text-base font-bold text-primary mb-0.5 truncate">
          {car.fullName}
        </h3>
        <div className="flex items-center gap-1 text-xs text-primary-subtle mb-3">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {TRANS_LABEL[car.transmission]} · {FUEL_LABEL[car.fuelType]} · {car.province}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-primary">
              {car.pricePerDay?.toLocaleString('vi-VN')}đ
            </span>
            <span className="text-xs text-primary-subtle">/ngày</span>
          </div>
          {car.totalReviews > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-primary">
                {Number(car.avgRating).toFixed(1)}
              </span>
              <span className="text-xs text-primary-subtle">({car.totalReviews})</span>
            </div>
          ) : (
            <span className="text-xs text-primary-subtle">Chưa có đánh giá</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Skeleton loader
export function CarCardSkeleton() {
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <div className="skeleton h-48 w-full" />
      <div className="p-4 space-y-2.5">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="flex justify-between items-center mt-1">
          <div className="skeleton h-5 w-1/3 rounded" />
          <div className="skeleton h-3 w-1/4 rounded" />
        </div>
      </div>
    </div>
  )
}