import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X } from 'lucide-react'
import { carApi } from '@/api/carApi'
import CarCard, { CarCardSkeleton } from '@/components/car/CarCard'
import FilterPanel from '@/components/car/FilterPanel'
import MainLayout from '@/components/layout/MainLayout'

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc',label: 'Giá giảm dần' },
  { value: 'rating',    label: 'Đánh giá cao' },
]

export default function CarSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilter, setShowFilter] = useState(false)
  const [page, setPage]   = useState(0)
  const [filters, setFilters] = useState({
    province:     searchParams.get('province')  || undefined,
    startDate:    searchParams.get('startDate') || undefined,
    endDate:      searchParams.get('endDate')   || undefined,
    sortBy:       'newest',
  })

  // Sync filters → URL
  useEffect(() => {
    const p = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v) })
    setSearchParams(p, { replace: true })
    setPage(0)
  }, [filters])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['cars', filters, page],
    queryFn: () => carApi.search({ ...filters, page, size: 12 }),
    keepPreviousData: true,
  })

  const result     = data?.data?.data
  const cars       = result?.content || []
  const totalPages = result?.totalPages || 0
  const totalItems = result?.totalElements || 0
  const loading    = isLoading || isFetching

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Tìm xe tự lái</h1>
            {!loading && (
              <p className="text-sm text-primary-subtle mt-1">
                Tìm thấy <span className="font-semibold text-primary">{totalItems}</span> xe phù hợp
              </p>
            )}
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="lg:hidden btn-secondary flex items-center gap-2 text-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Bộ lọc
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filter — desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <FilterPanel filters={filters} onChange={handleFilterChange} />
            </div>
          </aside>

          {/* Mobile filter overlay */}
          {showFilter && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/40"
                 onClick={() => setShowFilter(false)}>
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-surface overflow-y-auto p-4"
                   onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-primary">Bộ lọc</h2>
                  <button onClick={() => setShowFilter(false)}>
                    <X className="w-5 h-5 text-primary-muted" />
                  </button>
                </div>
                <FilterPanel filters={filters} onChange={(f) => { handleFilterChange(f); setShowFilter(false) }} />
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs text-primary-subtle font-medium shrink-0">Sắp xếp:</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleFilterChange({ sortBy: opt.value })}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold
                                border transition-all duration-150 ${
                      filters.sortBy === opt.value
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-primary-muted hover:border-border-strong'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid xe */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)}
              </div>
            ) : cars.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-4">🚗</div>
                <h3 className="text-lg font-bold text-primary mb-2">Không tìm thấy xe</h3>
                <p className="text-sm text-primary-subtle">Thử thay đổi bộ lọc hoặc chọn địa điểm khác</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {cars.map((car) => <CarCard key={car.id} car={car} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                >
                  ← Trước
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                        page === p ? 'bg-primary text-white' : 'text-primary-muted hover:bg-surface-soft'
                      }`}>
                      {p + 1}
                    </button>
                  )
                })}
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                >
                  Tiếp →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}