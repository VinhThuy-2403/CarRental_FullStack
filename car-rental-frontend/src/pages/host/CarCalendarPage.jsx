import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Lock, Unlock, Loader, Car } from 'lucide-react'
// Fix: dùng carApi thay vì calendarApi (không tồn tại)
import { carApi } from '@/api/carApi'
import HostLayout from '@/components/layout/HostLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const DAYS   = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const MONTHS = [
  'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12',
]

// Trạng thái ngày
const DAY_STYLE = {
  AVAILABLE: {
    bg:    'bg-surface border-border hover:border-teal-300',
    label: null,
  },
  BOOKED: {
    bg:    'bg-amber-50 border-amber-200 cursor-not-allowed',
    label: 'Có đơn',
  },
  BLOCKED: {
    bg:    'bg-red-50 border-red-200',
    label: 'Chặn',
  },
}

export default function CarCalendarPage() {
  const { carId }      = useParams()
  const navigate       = useNavigate()
  const queryClient    = useQueryClient()
  const today          = new Date()

  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  // Chọn ngày để block/unblock
  const [selectStart, setSelectStart] = useState(null)
  const [selectEnd,   setSelectEnd]   = useState(null)
  const [blockMode,   setBlockMode]   = useState(false)

  // ── Fetch xe ────────────────────────────────────────
  const { data: carRes } = useQuery({
    queryKey: ['my-car', carId],
    queryFn:  () => carApi.getMyCarDetail(carId),
  })
  const car = carRes?.data?.data

  // ── Fetch lịch ──────────────────────────────────────
  const { data: calRes, isLoading } = useQuery({
    queryKey: ['calendar', carId, year, month],
    // Fix: dùng carApi.getCalendar
    queryFn:  () => carApi.getCalendar(carId, year, month),
  })

  // Fix: backend trả về array thẳng, không có .calendar
  const calendarDays = calRes?.data?.data || []

  // Map date string → trạng thái để lookup nhanh
  const dayMap = useMemo(() => {
    const m = {}
    calendarDays.forEach((d) => { m[d.date] = d })
    return m
  }, [calendarDays])

  // ── Mutations ────────────────────────────────────────
  const blockMutation = useMutation({
    mutationFn: ({ startDate, endDate }) =>
      carApi.blockDates(carId, startDate, endDate),
    onSuccess: () => {
      toast.success('Chặn ngày thành công')
      queryClient.invalidateQueries(['calendar', carId, year, month])
      resetSelect()
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Chặn ngày thất bại'),
  })

  const unblockMutation = useMutation({
    mutationFn: ({ startDate, endDate }) =>
      carApi.unblockDates(carId, startDate, endDate),
    onSuccess: () => {
      toast.success('Mở lại ngày thành công')
      queryClient.invalidateQueries(['calendar', carId, year, month])
      resetSelect()
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Mở lại ngày thất bại'),
  })

  // ── Helpers ──────────────────────────────────────────
  const resetSelect = () => {
    setSelectStart(null)
    setSelectEnd(null)
    setBlockMode(false)
  }

  const toDateStr = (day) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const getStatus = (day) => {
    const key  = toDateStr(day)
    return dayMap[key]?.status || 'AVAILABLE'
  }

  const isPast = (day) => {
    const d = new Date(year, month - 1, day)
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return d < t
  }

  const isInRange = (day) => {
    if (!selectStart || !selectEnd) return false
    const [s, e] = selectStart <= selectEnd
      ? [selectStart, selectEnd]
      : [selectEnd, selectStart]
    return day >= s && day <= e
  }

  // ── Tính offset ngày đầu tháng (T2 = 0) ─────────────
  const daysInMonth   = new Date(year, month, 0).getDate()
  const firstWeekday  = new Date(year, month - 1, 1).getDay()
  const offset        = firstWeekday === 0 ? 6 : firstWeekday - 1

  // ── Điều hướng tháng ─────────────────────────────────
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // ── Click ngày ───────────────────────────────────────
  const handleDayClick = (day) => {
    if (!blockMode || isPast(day)) return
    const status = getStatus(day)
    if (status === 'BOOKED') {
      toast.error('Ngày này đã có đơn đặt, không thể thay đổi')
      return
    }

    if (!selectStart) {
      setSelectStart(day)
      setSelectEnd(day)
    } else {
      setSelectEnd(day)
    }
  }

  // ── Xác nhận block/unblock ───────────────────────────
  const handleConfirm = () => {
    if (!selectStart || !selectEnd) {
      toast.error('Vui lòng chọn ít nhất 1 ngày')
      return
    }
    const [s, e] = selectStart <= selectEnd
      ? [selectStart, selectEnd]
      : [selectEnd, selectStart]

    const startDate = toDateStr(s)
    const endDate   = toDateStr(e)

    // Kiểm tra trong range có ngày BOOKED không
    for (let d = s; d <= e; d++) {
      if (getStatus(d) === 'BOOKED') {
        toast.error(`Ngày ${d}/${month} đã có đơn đặt trong khoảng này`)
        return
      }
    }

    // Nếu ngày đầu đang BLOCKED → unblock, ngược lại → block
    const firstStatus = getStatus(s)
    if (firstStatus === 'BLOCKED') {
      unblockMutation.mutate({ startDate, endDate })
    } else {
      blockMutation.mutate({ startDate, endDate })
    }
  }

  const isMutating = blockMutation.isPending || unblockMutation.isPending

  // ── Render ────────────────────────────────────────────
  if (isLoading) {
    return (
      <HostLayout>
        <div className="flex items-center justify-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      </HostLayout>
    )
  }

  return (
    <HostLayout>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/host/calendar')}
            className="flex items-center gap-1 text-sm text-teal-600 font-semibold
                       hover:text-teal-800 transition-colors mb-3"
          >
            <ChevronLeft className="w-4 h-4" /> Chọn xe khác
          </button>
          <h1 className="text-2xl font-bold text-primary mb-0.5">
            {car ? `Lịch: ${car.fullName}` : 'Quản lý lịch xe'}
          </h1>
          <p className="text-sm text-primary-subtle">
            Xem và chặn ngày theo tháng
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-5 bg-surface border border-border
                        rounded-2xl px-5 py-3">
          {[
            { cls: 'bg-surface border border-border',       label: 'Còn trống' },
            { cls: 'bg-amber-50 border border-amber-200',   label: 'Có đơn đặt' },
            { cls: 'bg-red-50 border border-red-200',       label: 'Đã chặn' },
            { cls: 'bg-teal-100 border border-teal-300',    label: 'Đang chọn' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${item.cls}`} />
              <span className="text-xs text-primary-muted">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Calendar card */}
        <div className="bg-surface border border-border rounded-2xl p-5 mb-5">

          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl
                         hover:bg-surface-soft transition-colors">
              <ChevronLeft className="w-5 h-5 text-primary" />
            </button>
            <h2 className="text-lg font-bold text-primary">
              {MONTHS[month - 1]} {year}
            </h2>
            <button onClick={nextMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl
                         hover:bg-surface-soft transition-colors">
              <ChevronRight className="w-5 h-5 text-primary" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-bold text-primary-subtle py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Offset cells */}
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`e${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const status   = getStatus(day)
              const past     = isPast(day)
              const inRange  = isInRange(day)
              const isStart  = selectStart === day
              const isEnd    = selectEnd   === day
              const style    = DAY_STYLE[status] || DAY_STYLE.AVAILABLE

              let cellCls = style.bg
              if (inRange && blockMode)  cellCls = 'bg-teal-100 border-teal-300'
              if (past)                  cellCls += ' opacity-40'
              if (status === 'BOOKED')   cellCls += ' cursor-not-allowed'
              if (blockMode && !past && status !== 'BOOKED') cellCls += ' cursor-pointer'

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  disabled={!blockMode || past || status === 'BOOKED'}
                  className={`relative aspect-square rounded-xl border text-xs font-semibold
                               flex flex-col items-center justify-center gap-0.5
                               transition-all duration-100 ${cellCls}
                               ${isStart || isEnd ? 'ring-2 ring-teal-500 ring-offset-1' : ''}`}
                >
                  <span>{day}</span>
                  {style.label && (
                    <span className="text-[9px] font-medium opacity-70 leading-none">
                      {style.label}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Action panel */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          {!blockMode ? (
            <div className="flex gap-3">
              <button
                onClick={() => setBlockMode(true)}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
              >
                <Lock className="w-4 h-4" />
                Chặn ngày
              </button>
              <button
                onClick={() => setBlockMode(true)}
                className="flex-1 btn-secondary flex items-center justify-center gap-2 py-3"
              >
                <Unlock className="w-4 h-4" />
                Mở ngày đã chặn
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Hướng dẫn */}
              <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-teal-800 mb-0.5">
                  Chế độ chọn ngày đang bật
                </p>
                <p className="text-xs text-teal-600">
                  {!selectStart
                    ? 'Nhấn vào ngày bắt đầu'
                    : !selectEnd || selectEnd === selectStart
                      ? 'Nhấn ngày kết thúc (hoặc xác nhận 1 ngày)'
                      : `Đã chọn: ${Math.abs(selectEnd - selectStart) + 1} ngày`
                  }
                </p>
              </div>

              {/* Preview khoảng ngày */}
              {selectStart && (
                <div className="flex items-center gap-2 text-sm text-primary-muted">
                  <span className="font-semibold text-primary">
                    {String(selectStart).padStart(2,'0')}/{String(month).padStart(2,'0')}/{year}
                  </span>
                  {selectEnd && selectEnd !== selectStart && (
                    <>
                      <span>→</span>
                      <span className="font-semibold text-primary">
                        {String(selectEnd).padStart(2,'0')}/{String(month).padStart(2,'0')}/{year}
                      </span>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={!selectStart || isMutating}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 py-3
                             disabled:opacity-50"
                >
                  {isMutating
                    ? <><Loader className="w-4 h-4 animate-spin" />Đang xử lý...</>
                    : <><Lock className="w-4 h-4" />Xác nhận</>
                  }
                </button>
                <button
                  onClick={resetSelect}
                  className="flex-1 btn-secondary py-3"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-blue-800 mb-2">Lưu ý quan trọng</p>
          <ul className="text-xs text-blue-700 space-y-1 leading-relaxed">
            <li>• Ngày <strong>có đơn đặt</strong> (màu vàng) không thể chặn thủ công</li>
            <li>• Chọn ngày đang <strong>bị chặn</strong> rồi xác nhận để mở lại</li>
            <li>• Ngày bị chặn sẽ không hiển thị với khách hàng khi tìm kiếm</li>
          </ul>
        </div>

      </div>
    </HostLayout>
  )
}