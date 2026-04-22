import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminApi } from '@/api/adminApi'
import AdminLayout from '@/components/layout/AdminLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const STATUS_CONFIG = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  PENDING_CONFIRM: { label: 'Chờ xác nhận',   cls: 'bg-teal-50 text-teal-600 border-teal-100' },
  CONFIRMED:       { label: 'Đã xác nhận',    cls: 'bg-teal-50 text-teal-800 border-teal-200' },
  IN_PROGRESS:     { label: 'Đang thuê',       cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED:       { label: 'Hoàn thành',      cls: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED:       { label: 'Đã hủy',          cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  REFUNDED:        { label: 'Hoàn tiền',        cls: 'bg-purple-50 text-purple-600 border-purple-200' },
}

export default function AdminBookingsPage() {
  const [status, setStatus] = useState('')
  const [page,   setPage]   = useState(0)

  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-bookings', status, page],
    queryFn:  () => adminApi.getAllBookings({
      status: status || undefined,
      page, size: 15,
    }),
  })

  const data       = res?.data?.data
  const bookings   = data?.content     || []
  const totalPages = data?.totalPages  || 0
  const totalItems = data?.totalElements || 0

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-primary">Đơn đặt xe</h1>
          <p className="text-sm text-primary-subtle mt-0.5">Tất cả đơn trong hệ thống</p>
        </div>

        {/* Filter */}
        <div className="flex gap-3 flex-wrap items-center">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0) }}
            className="input-base w-52"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {!isLoading && (
            <p className="text-sm text-primary-subtle ml-1">
              <span className="font-semibold text-primary">{totalItems}</span> đơn
            </p>
          )}
        </div>

        {/* Table */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><LoadingSpinner /></div>
          ) : bookings.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-10 h-10 text-primary-subtle mx-auto mb-3 opacity-40" />
              <p className="text-primary-muted font-medium">Không có đơn nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-soft border-b border-border">
                  <tr>
                    {['Mã đơn', 'Xe', 'Khách hàng', 'Host', 'Ngày thuê', 'Tổng tiền', 'Trạng thái', 'Ngày tạo'].map((h) => (
                      <th key={h}
                          className="px-4 py-3 text-left text-xs font-semibold
                                     text-primary-subtle uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((b) => {
                    const badge = STATUS_CONFIG[b.status] || STATUS_CONFIG.CANCELLED
                    return (
                      <tr key={b.id} className="hover:bg-surface-soft transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs bg-surface-muted px-2 py-1 rounded-lg
                                           text-primary-muted font-semibold">
                            #{b.id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-primary truncate max-w-[140px]">
                            {b.carName}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-primary font-medium truncate max-w-[120px]">
                            {b.customerName}
                          </p>
                          <p className="text-xs text-primary-subtle truncate max-w-[120px]">
                            {b.customerEmail}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-primary-muted truncate max-w-[120px]">
                          {b.hostName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-primary-muted text-xs">
                          {b.startDate} → {b.endDate}
                          <br />
                          <span className="text-primary-subtle">{b.totalDays} ngày</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-primary whitespace-nowrap">
                          {Number(b.totalPrice).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                                           border whitespace-nowrap ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-primary-subtle whitespace-nowrap text-xs">
                          {b.createdAt
                            ? new Date(b.createdAt).toLocaleDateString('vi-VN')
                            : '--'}
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
    </AdminLayout>
  )
}