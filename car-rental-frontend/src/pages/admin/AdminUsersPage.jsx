import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Lock, Unlock, Eye, Users,
  ChevronLeft, ChevronRight, X, Car, FileText,
  Home, CheckCircle, XCircle, Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '@/api/adminApi'
import AdminLayout from '@/components/layout/AdminLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'

// ─── Config ───────────────────────────────────────────
const ROLE_BADGE = {
  CUSTOMER: 'bg-blue-50 text-blue-600 border-blue-100',
  HOST:     'bg-purple-50 text-purple-600 border-purple-100',
  ADMIN:    'bg-gray-100 text-gray-600 border-gray-200',
}
const STATUS_BADGE = {
  ACTIVE:     'bg-teal-50 text-teal-600 border-teal-100',
  LOCKED:     'bg-red-50 text-red-600 border-red-200',
  UNVERIFIED: 'bg-yellow-50 text-yellow-600 border-yellow-200',
}
const BOOKING_STATUS_LABEL = {
  PENDING_PAYMENT: 'Chờ TT',
  PENDING_CONFIRM: 'Chờ XN',
  CONFIRMED:       'Đã XN',
  IN_PROGRESS:     'Đang thuê',
  COMPLETED:       'Hoàn thành',
  CANCELLED:       'Đã hủy',
  REFUNDED:        'Hoàn tiền',
}
const CAR_STATUS_LABEL = {
  PENDING:  'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  INACTIVE: 'Ẩn',
}

// ─── Activity Modal ───────────────────────────────────
function ActivityModal({ userId, onClose }) {
  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-user-activity', userId],
    queryFn:  () => adminApi.getUserActivity(userId),
    enabled:  !!userId,
  })
  const d = res?.data?.data

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-modal w-full max-w-2xl max-h-[90vh]
                      overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface">
          <h3 className="font-bold text-primary">Lịch sử hoạt động</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-primary-muted" /></button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : d ? (
          <div className="p-5 space-y-5">
            {/* User info */}
            <div className="flex items-center gap-4 bg-surface-soft rounded-xl p-4">
              <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-100
                              flex items-center justify-center text-teal-600 text-lg font-bold shrink-0">
                {d.fullName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-primary">{d.fullName}</p>
                <p className="text-sm text-primary-subtle">{d.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
                                   ${ROLE_BADGE[d.role]}`}>
                    {d.role === 'CUSTOMER' ? 'Khách hàng' : d.role === 'HOST' ? 'Host' : 'Admin'}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
                                   ${STATUS_BADGE[d.status]}`}>
                    {d.status === 'ACTIVE' ? 'Hoạt động' : d.status === 'LOCKED' ? 'Bị khóa' : 'Chưa xác thực'}
                  </span>
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-primary-subtle">Ngày tham gia</p>
                <p className="text-sm font-semibold text-primary">
                  {d.createdAt ? new Date(d.createdAt).toLocaleDateString('vi-VN') : '--'}
                </p>
              </div>
            </div>

            {/* Booking history (Customer) */}
            {d.role === 'CUSTOMER' && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-primary-muted" />
                  <p className="text-sm font-bold text-primary">
                    Lịch sử đặt xe ({d.recentBookings?.length || 0} đơn gần nhất)
                  </p>
                </div>
                {!d.recentBookings?.length ? (
                  <p className="text-sm text-primary-subtle text-center py-4">Chưa có đơn đặt xe</p>
                ) : (
                  <div className="space-y-2">
                    {d.recentBookings.map((b) => (
                      <div key={b.id}
                           className="flex items-center justify-between bg-surface-soft
                                      rounded-xl px-4 py-3 border border-border">
                        <div>
                          <p className="text-sm font-semibold text-primary">{b.carName}</p>
                          <p className="text-xs text-primary-subtle">
                            {b.startDate} → {b.endDate}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">
                            {Number(b.totalPrice).toLocaleString('vi-VN')}đ
                          </p>
                          <span className="text-xs text-primary-subtle">
                            {BOOKING_STATUS_LABEL[b.status] || b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cars (Host) */}
            {d.role === 'HOST' && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-4 h-4 text-primary-muted" />
                  <p className="text-sm font-bold text-primary">
                    Xe đang đăng ({d.cars?.length || 0} xe)
                  </p>
                </div>
                {!d.cars?.length ? (
                  <p className="text-sm text-primary-subtle text-center py-4">Chưa đăng xe nào</p>
                ) : (
                  <div className="space-y-2">
                    {d.cars.map((c) => (
                      <div key={c.id}
                           className="flex items-center justify-between bg-surface-soft
                                      rounded-xl px-4 py-3 border border-border">
                        <div>
                          <p className="text-sm font-semibold text-primary">{c.fullName}</p>
                          <p className="text-xs text-primary-subtle">{c.licensePlate}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          c.status === 'APPROVED'
                            ? 'bg-teal-50 text-teal-600 border-teal-100'
                            : c.status === 'PENDING'
                              ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                              : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {CAR_STATUS_LABEL[c.status] || c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-center py-12 text-primary-muted">Không tìm thấy dữ liệu</p>
        )}
      </div>
    </div>
  )
}

// ─── Host Request Tab ─────────────────────────────────
function HostRequestsTab() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [rejectModal, setRejectModal] = useState(null) // { id, name }
  const [rejectNote, setRejectNote]   = useState('')

  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-host-requests', page],
    queryFn:  () => adminApi.getHostRequests({ page, size: 10 }),
  })
  const data       = res?.data?.data
  const requests   = data?.content   || []
  const totalPages = data?.totalPages || 0

  const approveMutation = useMutation({
    mutationFn: (id) => adminApi.approveHostRequest(id),
    onSuccess: () => {
      toast.success('Đã duyệt! Tài khoản được nâng cấp lên Host 🎉')
      queryClient.invalidateQueries(['admin-host-requests'])
      queryClient.invalidateQueries(['admin-users'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Thất bại'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }) => adminApi.rejectHostRequest(id, note),
    onSuccess: () => {
      toast.success('Đã từ chối yêu cầu')
      setRejectModal(null)
      setRejectNote('')
      queryClient.invalidateQueries(['admin-host-requests'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Thất bại'),
  })

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : requests.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl py-16 text-center">
          <Home className="w-10 h-10 text-primary-subtle mx-auto mb-3 opacity-40" />
          <p className="text-primary-muted font-medium">Không có yêu cầu nào đang chờ duyệt</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-soft transition-colors">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100
                                flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                  {r.userAvatarUrl
                    ? <img src={r.userAvatarUrl} className="w-full h-full rounded-full object-cover" />
                    : r.userFullName?.charAt(0).toUpperCase()
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-primary text-sm">{r.userFullName}</p>
                  <p className="text-xs text-primary-subtle">{r.userEmail}</p>
                  <p className="text-xs text-primary-subtle mt-0.5">
                    Gửi lúc: {new Date(r.requestedAt).toLocaleString('vi-VN')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (window.confirm(`Duyệt yêu cầu Host của "${r.userFullName}"?`))
                        approveMutation.mutate(r.id)
                    }}
                    disabled={approveMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white
                               rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors
                               disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Duyệt
                  </button>
                  <button
                    onClick={() => { setRejectModal({ id: r.id, name: r.userFullName }); setRejectNote('') }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600
                               border border-red-200 rounded-lg text-xs font-semibold
                               hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-primary-subtle">Trang {page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-modal w-full max-w-md p-6 animate-slide-up">
            <h3 className="font-bold text-primary mb-1">Từ chối yêu cầu</h3>
            <p className="text-sm text-primary-subtle mb-4">
              Đang từ chối yêu cầu của <span className="font-semibold">{rejectModal.name}</span>
            </p>
            <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
              Lý do (hiển thị cho user)
            </label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="VD: Hồ sơ chưa đầy đủ, vui lòng liên hệ lại..."
              rows={3}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-400/25 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => rejectMutation.mutate({ id: rejectModal.id, note: rejectNote })}
                disabled={rejectMutation.isPending}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold
                           hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Xác nhận từ chối
              </button>
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 bg-surface-soft border border-border py-2.5 rounded-xl
                           text-sm font-semibold hover:bg-surface-muted transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────
export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('users')
  const [keyword,  setKeyword]  = useState('')
  const [role,     setRole]     = useState('')
  const [status,   setStatus]   = useState('')
  const [page,     setPage]     = useState(0)
  const [viewUser, setViewUser] = useState(null)

  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-users', role, status, keyword, page],
    queryFn:  () => adminApi.getAllUsers({
      role:    role    || undefined,
      status:  status  || undefined,
      keyword: keyword || undefined,
      page, size: 15,
    }),
  })

  const data       = res?.data?.data
  const users      = data?.content   || []
  const totalPages = data?.totalPages  || 0
  const totalItems = data?.totalElements || 0

  const lockMutation = useMutation({
    mutationFn: (id) => adminApi.lockUser(id),
    onSuccess: () => {
      toast.success('Đã khóa tài khoản')
      queryClient.invalidateQueries(['admin-users'])
      queryClient.invalidateQueries(['admin-dashboard'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Thao tác thất bại'),
  })

  const unlockMutation = useMutation({
    mutationFn: (id) => adminApi.unlockUser(id),
    onSuccess: () => {
      toast.success('Đã mở khóa tài khoản')
      queryClient.invalidateQueries(['admin-users'])
      queryClient.invalidateQueries(['admin-dashboard'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Thao tác thất bại'),
  })

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-primary">Người dùng</h1>
          <p className="text-sm text-primary-subtle mt-0.5">Quản lý tài khoản hệ thống</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {[
            { key: 'users',    label: 'Danh sách', icon: Users },
            { key: 'requests', label: 'Yêu cầu Host', icon: Home },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold
                          border-b-2 transition-colors ${
                activeTab === key
                  ? 'text-primary border-teal-600'
                  : 'text-primary-muted border-transparent hover:text-primary'
              }`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {activeTab === 'requests' ? (
          <HostRequestsTab />
        ) : (<>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-subtle" />
            <input
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(0) }}
              placeholder="Tìm theo tên, email..."
              className="input-base pl-9"
            />
          </div>
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(0) }}
                  className="input-base w-44">
            <option value="">Tất cả vai trò</option>
            <option value="CUSTOMER">Khách hàng</option>
            <option value="HOST">Host</option>
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }}
                  className="input-base w-44">
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="LOCKED">Bị khóa</option>
            <option value="UNVERIFIED">Chưa xác thực</option>
          </select>
        </div>

        {!isLoading && (
          <p className="text-sm text-primary-subtle">
            Tìm thấy <span className="font-semibold text-primary">{totalItems}</span> người dùng
          </p>
        )}

        {/* Table */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><LoadingSpinner /></div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-primary-subtle mx-auto mb-3 opacity-40" />
              <p className="text-primary-muted font-medium">Không có người dùng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-soft border-b border-border">
                  <tr>
                    {['Người dùng', 'Email', 'SĐT', 'Vai trò', 'Trạng thái', 'Ngày tham gia', 'Thao tác'].map((h) => (
                      <th key={h}
                          className="px-4 py-3 text-left text-xs font-semibold
                                     text-primary-subtle uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-soft transition-colors">
                      {/* Avatar + Tên */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl}
                                 className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100
                                            flex items-center justify-center text-teal-600
                                            text-sm font-bold shrink-0">
                              {u.fullName?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-semibold text-primary truncate max-w-[140px]">
                            {u.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-primary-muted truncate max-w-[180px]">
                        {u.email}
                      </td>
                      <td className="px-4 py-3 text-primary-muted whitespace-nowrap">
                        {u.phone || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border
                                         ${ROLE_BADGE[u.role] || ''}`}>
                          {u.role === 'CUSTOMER' ? 'Khách hàng'
                            : u.role === 'HOST' ? 'Host' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border
                                         ${STATUS_BADGE[u.status] || ''}`}>
                          {u.status === 'ACTIVE' ? 'Hoạt động'
                            : u.status === 'LOCKED' ? 'Bị khóa' : 'Chưa XN'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-primary-subtle whitespace-nowrap text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '--'}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setViewUser(u.id)}
                            className="p-1.5 rounded-lg hover:bg-surface-muted
                                       text-primary-muted hover:text-primary transition-colors"
                            title="Xem hoạt động"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {u.role !== 'ADMIN' && (
                            u.status === 'LOCKED' ? (
                              <button
                                onClick={() => unlockMutation.mutate(u.id)}
                                disabled={unlockMutation.isPending}
                                className="p-1.5 rounded-lg hover:bg-teal-50
                                           text-teal-600 transition-colors disabled:opacity-50"
                                title="Mở khóa"
                              >
                                <Unlock className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Khóa tài khoản ${u.fullName}?`))
                                    lockMutation.mutate(u.id)
                                }}
                                disabled={lockMutation.isPending}
                                className="p-1.5 rounded-lg hover:bg-red-50
                                           text-red-500 transition-colors disabled:opacity-50"
                                title="Khóa tài khoản"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
        </>) /* end users tab */}
      </div>

      {viewUser && (
        <ActivityModal userId={viewUser} onClose={() => setViewUser(null)} />
      )}
    </AdminLayout>
  )
}