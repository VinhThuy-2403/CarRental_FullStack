import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Edit, Trash2, Plus, AlertCircle } from 'lucide-react'
import { carApi } from '@/api/carApi'
import MainLayout from '@/components/layout/MainLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import HostLayout from '../../components/layout/HostLayout'


const CAR_STATUS_LABEL = {
  PENDING: { label: 'Chờ duyệt', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-teal-50 text-teal-600 border-teal-100' },
  REJECTED: { label: 'Bị từ chối', color: 'bg-red-50 text-red-600 border-red-200' },
  INACTIVE: { label: 'Ẩn', color: 'bg-gray-100 text-gray-500 border-gray-200' },
}

const FUEL_LABEL = {
  GASOLINE: 'Xăng',
  DIESEL: 'Dầu diesel',
  ELECTRIC: 'Điện',
  HYBRID: 'Hybrid',
}

const TRANS_LABEL = {
  AUTOMATIC: 'Tự động',
  MANUAL: 'Số sàn',
}

export default function MyCarsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus] = useState('ALL')

  const { data: res, isLoading } = useQuery({
    queryKey: ['my-cars', filterStatus],
    queryFn: () => carApi.getMyCars(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => carApi.delete(id),
    onSuccess: () => {
      toast.success('Xóa xe thành công')
      queryClient.invalidateQueries(['my-cars'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Xóa xe thất bại')
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, currentStatus }) => {
      const newStatus = currentStatus === 'APPROVED' ? 'INACTIVE' : 'APPROVED'
      return carApi.updateStatus(id, newStatus)
    },
    onSuccess: (_, { currentStatus }) => {
      const newStatus = currentStatus === 'APPROVED' ? 'INACTIVE' : 'APPROVED'
      toast.success(newStatus === 'INACTIVE' ? 'Đã ẩn xe' : 'Đã hiển thị xe')
      queryClient.invalidateQueries(['my-cars'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại')
    },
  })

  const cars = res?.data?.data || []

  let filteredCars = cars
  if (filterStatus !== 'ALL') {
    filteredCars = cars.filter((car) => car.status === filterStatus)
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <HostLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Xe của tôi</h1>
            <p className="text-primary-muted">Quản lý danh sách xe thuê</p>
          </div>
          <button
            onClick={() => navigate('/host/cars/new')}
            className="bg-primary text-white px-5 py-3 rounded-xl text-sm font-semibold
                       flex items-center gap-2 hover:bg-primary-soft transition-colors"
          >
            <Plus className="w-4 h-4" />
            Đăng xe mới
          </button>
        </div>

        {/* Filter & Stats */}
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
              Tất cả ({cars.length})
            </button>
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'PENDING'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-surface-soft text-primary hover:bg-surface-muted'
              }`}
            >
              Chờ duyệt ({cars.filter((c) => c.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setFilterStatus('APPROVED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'APPROVED'
                  ? 'bg-teal-600 text-white'
                  : 'bg-surface-soft text-primary hover:bg-surface-muted'
              }`}
            >
              Đã duyệt ({cars.filter((c) => c.status === 'APPROVED').length})
            </button>
            <button
              onClick={() => setFilterStatus('REJECTED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'REJECTED'
                  ? 'bg-red-600 text-white'
                  : 'bg-surface-soft text-primary hover:bg-surface-muted'
              }`}
            >
              Bị từ chối ({cars.filter((c) => c.status === 'REJECTED').length})
            </button>
          </div>
        </div>

        {/* Cars List */}
        {filteredCars.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-12 text-center">
            <p className="text-primary-muted mb-4">Chưa có xe nào</p>
            <button
              onClick={() => navigate('/host/cars/new')}
              className="text-teal-600 font-semibold hover:text-teal-800 transition-colors"
            >
              Đăng xe mới ngay →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCars.map((car) => (
              <div
                key={car.id}
                className="bg-surface border border-border rounded-2xl overflow-hidden
                           hover:shadow-card transition-all duration-200"
              >
                <div className="p-4 flex flex-col md:flex-row gap-4">
                  {/* Car Image */}
                  <div className="w-full md:w-32 h-32 bg-surface-muted rounded-xl overflow-hidden flex-shrink-0">
                    {car.primaryImageUrl ? (
                      <img
                        src={car.primaryImageUrl}
                        alt={car.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-primary-subtle text-xs">Chưa có ảnh</span>
                      </div>
                    )}
                  </div>

                  {/* Car Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-primary mb-1 truncate">
                          {car.fullName}
                        </h3>
                        <p className="text-sm text-primary-muted mb-2">
                          {TRANS_LABEL[car.transmission]} · {FUEL_LABEL[car.fuelType]} ·{' '}
                          {car.seats} chỗ · {car.province}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap ${
                          CAR_STATUS_LABEL[car.status]?.color
                        }`}
                      >
                        {CAR_STATUS_LABEL[car.status]?.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xs text-primary-subtle mb-1">Giá thuê</p>
                          <p className="text-lg font-bold text-primary">
                            {car.pricePerDay?.toLocaleString('vi-VN')}đ/ngày
                          </p>
                        </div>
                        {car.status === 'REJECTED' && (
                          <div className="flex items-start gap-2 text-red-600">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="text-xs">
                              <p className="font-medium">Lý do: </p>
                              <p>{car.rejectionReason}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 md:flex-col md:justify-start">
                    {car.status === 'REJECTED' ? (
                      <button
                        onClick={() => navigate(`/host/cars/${car.id}/edit`)}
                        className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white
                                   rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Chỉnh sửa
                      </button>
                    ) : car.status === 'PENDING' ? (
                      <button
                        onClick={() => navigate(`/host/cars/${car.id}/edit`)}
                        className="flex items-center gap-2 px-3 py-2 bg-primary text-white
                                   rounded-lg text-sm font-medium hover:bg-primary-soft transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Chỉnh sửa
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate(`/host/cars/${car.id}/edit`)}
                          className="flex items-center gap-2 px-3 py-2 bg-primary text-white
                                     rounded-lg text-sm font-medium hover:bg-primary-soft transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => navigate(`/host/calendar/${car.id}`)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white
                                     rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          📅 Lịch
                        </button>
                      </>
                    )}

                    {car.status === 'APPROVED' ? (
                      <button
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: car.id,
                            currentStatus: car.status,
                          })
                        }
                        disabled={toggleStatusMutation.isPending}
                        className="flex items-center gap-2 px-3 py-2 bg-surface-soft border
                                   border-border rounded-lg text-sm font-medium text-primary
                                   hover:bg-surface-muted transition-colors disabled:opacity-50"
                      >
                        <EyeOff className="w-4 h-4" />
                        Ẩn
                      </button>
                    ) : car.status === 'INACTIVE' ? (
                      <button
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: car.id,
                            currentStatus: car.status,
                          })
                        }
                        disabled={toggleStatusMutation.isPending}
                        className="flex items-center gap-2 px-3 py-2 bg-teal-100 border
                                   border-teal-200 rounded-lg text-sm font-medium text-teal-600
                                   hover:bg-teal-200 transition-colors disabled:opacity-50"
                      >
                        <Eye className="w-4 h-4" />
                        Hiển thị
                      </button>
                    ) : null}

                    {car.status === 'INACTIVE' || car.status === 'REJECTED' ? (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              'Bạn chắc chắn muốn xóa xe này? Thao tác này không thể hoàn tác.'
                            )
                          ) {
                            deleteMutation.mutate(car.id)
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="flex items-center gap-2 px-3 py-2 bg-red-50 border
                                   border-red-200 rounded-lg text-sm font-medium text-red-600
                                   hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </HostLayout>
  )
}
