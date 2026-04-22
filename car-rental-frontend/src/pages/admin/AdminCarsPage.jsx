import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Car, CheckCircle, XCircle, Eye, Search,
  ChevronLeft, ChevronRight, MapPin, User, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '@/api/adminApi'
import AdminLayout from '@/components/layout/AdminLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'

// ─── Status badge ─────────────────────────────────────
const STATUS = {
  PENDING:  { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Đã duyệt',  cls: 'bg-teal-50 text-teal-600 border-teal-100' },
  REJECTED: { label: 'Từ chối',   cls: 'bg-red-50 text-red-600 border-red-200' },
  INACTIVE: { label: 'Ẩn',        cls: 'bg-gray-100 text-gray-500 border-gray-200' },
}

// ─── Modal từ chối ────────────────────────────────────
function RejectModal({ car, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-modal w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-primary">Từ chối xe</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-primary-muted" /></button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-primary-muted mb-3">
            Xe: <span className="font-semibold text-primary">{car?.fullName}</span>
          </p>
          <label className="block text-xs font-semibold text-primary-subtle uppercase
                             tracking-wider mb-1.5">
            Lý do từ chối *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do cụ thể để host biết cần sửa gì..."
            rows={4}
            className="input-base resize-none"
            autoFocus
          />
          <p className="text-xs text-primary-subtle mt-1">{reason.length}/500 ký tự</p>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-border">
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || loading}
            className="flex-1 btn-danger flex items-center justify-center gap-2 py-2.5
                       disabled:opacity-50"
          >
            {loading && <LoadingSpinner size="sm" />}
            Xác nhận từ chối
          </button>
          <button onClick={onClose} className="flex-1 btn-secondary py-2.5">
            Hủy
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal xem chi tiết xe ────────────────────────────
function CarDetailModal({ carId, onClose }) {
  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-car-detail', carId],
    queryFn:  () => adminApi.getCarDetail(carId),
    enabled:  !!carId,
  })
  const car = res?.data?.data

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-modal w-full max-w-2xl max-h-[90vh]
                      overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface">
          <h3 className="font-bold text-primary">Chi tiết xe</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-primary-muted" /></button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : car ? (
          <div className="p-5 space-y-5">
            {/* Ảnh */}
            {car.images?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {car.images.slice(0, 6).map((img, i) => (
                  <div key={i} className="aspect-video rounded-xl overflow-hidden bg-surface-muted">
                    <img src={img.url} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Thông tin cơ bản */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Biển số', car.licensePlate],
                ['Hãng / Model', `${car.brand} ${car.model} ${car.year}`],
                ['Số chỗ', `${car.seats} chỗ`],
                ['Hộp số', car.transmission === 'AUTOMATIC' ? 'Tự động' : 'Số sàn'],
                ['Nhiên liệu', car.fuelType],
                ['Giá thuê', `${Number(car.pricePerDay).toLocaleString('vi-VN')}đ/ngày`],
                ['Đặt cọc', `${Number(car.depositAmount ?? car.deposit ?? 0).toLocaleString('vi-VN')}đ`],
                ['Địa điểm', car.province],
              ].map(([k, v]) => (
                <div key={k} className="bg-surface-soft rounded-xl px-3 py-2">
                  <p className="text-xs text-primary-subtle">{k}</p>
                  <p className="text-sm font-semibold text-primary mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            {/* Tính năng */}
            {car.features?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-2">
                  Tính năng
                </p>
                <div className="flex flex-wrap gap-2">
                  {car.features.map((f) => (
                    <span key={f} className="bg-surface-muted border border-border
                                             text-xs text-primary-muted px-2.5 py-1 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mô tả */}
            {car.description && (
              <div>
                <p className="text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1">
                  Mô tả
                </p>
                <p className="text-sm text-primary-muted leading-relaxed">{car.description}</p>
              </div>
            )}

            {/* Host */}
            <div className="bg-surface-soft border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-3">
                Thông tin Host
              </p>
              <div className="flex items-center gap-3">
                {car.host?.avatarUrl ? (
                  <img src={car.host.avatarUrl}
                       className="w-10 h-10 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center
                                  justify-center text-teal-600 font-bold text-sm border border-teal-100">
                    {car.host?.fullName?.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-primary text-sm">{car.host?.fullName}</p>
                  <p className="text-xs text-primary-subtle">{car.host?.fullName}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center py-12 text-primary-muted">Không tìm thấy xe</p>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────
export default function AdminCarsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const [keyword,    setKeyword]    = useState('')
  const [status,     setStatus]     = useState(searchParams.get('status') || '')
  const [page,       setPage]       = useState(0)
  const [rejectCar,  setRejectCar]  = useState(null)
  const [detailCarId, setDetailCarId] = useState(null)
  const [tab,        setTab]        = useState(searchParams.get('status') === 'PENDING' ? 'pending' : 'all')

  // ── Queries ──────────────────────────────────────────
  const { data: pendingRes, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-pending-cars', page],
    queryFn:  () => adminApi.getPendingCars({ page, size: 10 }),
    enabled:  tab === 'pending',
  })

  const { data: allRes, isLoading: allLoading } = useQuery({
    queryKey: ['admin-all-cars', status, keyword, page],
    queryFn:  () => adminApi.getAllCars({ status: status || undefined, keyword: keyword || undefined, page, size: 10 }),
    enabled:  tab === 'all',
  })

  const pendingData = pendingRes?.data?.data
  const allData     = allRes?.data?.data
  const cars        = tab === 'pending' ? (pendingData?.content || []) : (allData?.content || [])
  const totalPages  = tab === 'pending' ? (pendingData?.totalPages || 0) : (allData?.totalPages || 0)
  const totalItems  = tab === 'pending' ? (pendingData?.totalElements || 0) : (allData?.totalElements || 0)
  const loading     = tab === 'pending' ? pendingLoading : allLoading

  // ── Mutations ────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: (id) => adminApi.approveCar(id),
    onSuccess: () => {
      toast.success('Đã duyệt xe thành công!')
      queryClient.invalidateQueries(['admin-pending-cars'])
      queryClient.invalidateQueries(['admin-all-cars'])
      queryClient.invalidateQueries(['admin-dashboard'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Duyệt xe thất bại'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => adminApi.rejectCar(id, reason),
    onSuccess: () => {
      toast.success('Đã từ chối xe')
      setRejectCar(null)
      queryClient.invalidateQueries(['admin-pending-cars'])
      queryClient.invalidateQueries(['admin-all-cars'])
      queryClient.invalidateQueries(['admin-dashboard'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Thao tác thất bại'),
  })

  const handleSearch = () => { setPage(0) }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Quản lý xe</h1>
            <p className="text-sm text-primary-subtle mt-0.5">Duyệt và quản lý xe cho thuê</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {[
            { key: 'pending', label: 'Chờ duyệt' },
            { key: 'all',     label: 'Tất cả xe' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(0) }}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-primary-muted hover:text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filter bar (chỉ khi tab = all) */}
        {tab === 'all' && (
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-subtle" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Tìm theo tên, biển số..."
                className="input-base pl-9"
              />
            </div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0) }}
              className="input-base w-44"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Từ chối</option>
              <option value="INACTIVE">Ẩn</option>
            </select>
          </div>
        )}

        {/* Result count */}
        {!loading && (
          <p className="text-sm text-primary-subtle">
            Tìm thấy <span className="font-semibold text-primary">{totalItems}</span> xe
          </p>
        )}

        {/* Table */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner /></div>
          ) : cars.length === 0 ? (
            <div className="py-16 text-center">
              <Car className="w-10 h-10 text-primary-subtle mx-auto mb-3 opacity-40" />
              <p className="text-primary-muted font-medium">Không có xe nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-soft border-b border-border">
                  <tr>
                    {['Xe', 'Host', 'Địa điểm', 'Giá/ngày', 'Trạng thái', 'Ngày đăng', 'Thao tác'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold
                                              text-primary-subtle uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cars.map((car) => {
                    const badge = STATUS[car.status] || STATUS.INACTIVE
                    return (
                      <tr key={car.id} className="hover:bg-surface-soft transition-colors">
                        {/* Xe */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-10 rounded-lg overflow-hidden bg-surface-muted shrink-0">
                              {car.primaryImageUrl
                                ? <img src={car.primaryImageUrl} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center">
                                    <Car className="w-4 h-4 text-primary-subtle opacity-40" />
                                  </div>
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-primary truncate max-w-[160px]">
                                {car.fullName}
                              </p>
                              <p className="text-xs text-primary-subtle">{car.licensePlate}</p>
                            </div>
                          </div>
                        </td>
                        {/* Host */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-primary-subtle shrink-0" />
                            <div className="min-w-0">
                              <p className="text-primary font-medium truncate max-w-[120px]">
                                {car.hostName}
                              </p>
                              <p className="text-xs text-primary-subtle truncate max-w-[120px]">
                                {car.hostEmail}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* Địa điểm */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-primary-muted">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-sm">{car.province}</span>
                          </div>
                        </td>
                        {/* Giá */}
                        <td className="px-4 py-3 font-semibold text-primary whitespace-nowrap">
                          {Number(car.pricePerDay).toLocaleString('vi-VN')}đ
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                                           border ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        {/* Ngày đăng */}
                        <td className="px-4 py-3 text-primary-muted whitespace-nowrap text-xs">
                          {car.createdAt
                            ? new Date(car.createdAt).toLocaleDateString('vi-VN')
                            : '--'}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {/* Xem chi tiết */}
                            <button
                              onClick={() => setDetailCarId(car.id)}
                              className="p-1.5 rounded-lg hover:bg-surface-muted
                                         text-primary-muted hover:text-primary transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {/* Duyệt (chỉ khi PENDING) */}
                            {car.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => approveMutation.mutate(car.id)}
                                  disabled={approveMutation.isPending}
                                  className="p-1.5 rounded-lg hover:bg-teal-50
                                             text-teal-600 transition-colors disabled:opacity-50"
                                  title="Duyệt xe"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setRejectCar(car)}
                                  className="p-1.5 rounded-lg hover:bg-red-50
                                             text-red-500 transition-colors"
                                  title="Từ chối"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-primary-subtle px-3">
              Trang {page + 1} / {totalPages}
            </span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {rejectCar && (
        <RejectModal
          car={rejectCar}
          loading={rejectMutation.isPending}
          onConfirm={(reason) => rejectMutation.mutate({ id: rejectCar.id, reason })}
          onClose={() => setRejectCar(null)}
        />
      )}
      {detailCarId && (
        <CarDetailModal carId={detailCarId} onClose={() => setDetailCarId(null)} />
      )}
    </AdminLayout>
  )
}