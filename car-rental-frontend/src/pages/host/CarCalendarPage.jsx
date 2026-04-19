import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Lock, Unlock, Loader } from 'lucide-react'
import { calendarApi } from '@/api/calendarApi'
import { carApi } from '@/api/carApi'
import MainLayout from '@/components/layout/MainLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import HostLayout from '../../components/layout/HostLayout'

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const MONTHS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
]

export default function CarCalendarPage() {
  const { carId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selectedRange, setSelectedRange] = useState({ start: null, end: null })
  const [blockMode, setBlockMode] = useState(false)

  const { data: carRes } = useQuery({
    queryKey: ['car-detail', carId],
    queryFn: () => carApi.getMyCarDetail(carId),
  })

  const { data: calendarRes, isLoading } = useQuery({
    queryKey: ['calendar', carId, year, month],
    queryFn: () => calendarApi.getCalendar(carId, year, month),
  })

  const blockMutation = useMutation({
    mutationFn: ({ startDate, endDate }) =>
      calendarApi.blockDates(carId, startDate, endDate),
    onSuccess: () => {
      toast.success('Chặn ngày thành công')
      queryClient.invalidateQueries(['calendar', carId, year, month])
      setSelectedRange({ start: null, end: null })
      setBlockMode(false)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Chặn ngày thất bại')
    },
  })

  const unblockMutation = useMutation({
    mutationFn: ({ startDate, endDate }) =>
      calendarApi.unblockDates(carId, startDate, endDate),
    onSuccess: () => {
      toast.success('Mở lại ngày thành công')
      queryClient.invalidateQueries(['calendar', carId, year, month])
      setSelectedRange({ start: null, end: null })
      setBlockMode(false)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Mở lại ngày thất bại')
    },
  })

  const calendar = calendarRes?.data?.data?.calendar || []

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const calendarDays = useMemo(() => {
    return calendar.slice(0, daysInMonth)
  }, [calendar, daysInMonth])

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  const handleDateClick = (day) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayData = calendarDays[day - 1]

    if (!blockMode) return

    if (!selectedRange.start) {
      setSelectedRange({ start: day, end: day })
    } else if (!selectedRange.end) {
      const [start, end] = [selectedRange.start, day].sort((a, b) => a - b)
      setSelectedRange({ start, end })
    }
  }

  const handleConfirmBlock = () => {
    if (!selectedRange.start || !selectedRange.end) {
      toast.error('Chọn ngày bắt đầu và kết thúc')
      return
    }

    const startStr = `${year}-${String(month).padStart(2, '0')}-${String(selectedRange.start).padStart(2, '0')}`
    const endStr = `${year}-${String(month).padStart(2, '0')}-${String(selectedRange.end).padStart(2, '0')}`

    const dayData = calendarDays[selectedRange.start - 1]
    if (dayData?.status === 'BLOCKED') {
      unblockMutation.mutate({ startDate: startStr, endDate: endStr })
    } else {
      blockMutation.mutate({ startDate: startStr, endDate: endStr })
    }
  }

  const handleReset = () => {
    setSelectedRange({ start: null, end: null })
    setBlockMode(false)
  }

  const isDateSelected = (day) => {
    if (!selectedRange.start || !selectedRange.end) return false
    return day >= selectedRange.start && day <= selectedRange.end
  }

  const getDateStatus = (dayData) => {
    if (!dayData) return 'EMPTY'
    return dayData.status
  }

  if (isLoading) return <LoadingSpinner />

  const car = carRes?.data?.data

  return (
    <HostLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/host/cars')}
            className="text-teal-600 text-sm font-semibold mb-4 hover:text-teal-800 transition-colors"
          >
            ← Quay lại
          </button>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Lịch xe: {car?.fullName}
          </h1>
          <p className="text-primary-muted">
            Quản lý lịch và chặn ngày để tránh xung đột đơn đặt
          </p>
        </div>

        {/* Legend */}
        <div className="bg-surface border border-border rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-xs text-primary">Trống</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-100 border border-amber-300 rounded"></div>
              <span className="text-xs text-primary">Bận</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-xs text-primary">Bị chặn</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span className="text-xs text-primary">Không hợp lệ</span>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          {/* Month/Year header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-surface-soft rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-primary" />
            </button>

            <h2 className="text-xl font-bold text-primary">
              {MONTHS[month - 1]} {year}
            </h2>

            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-surface-soft rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-primary" />
            </button>
          </div>

          {/* Days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-xs font-bold text-primary-muted py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells */}
            {Array(adjustedFirstDay)
              .fill(null)
              .map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}

            {/* Date cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayData = calendarDays[i]
              const status = getDateStatus(dayData)
              const isSelected = isDateSelected(day)
              const isStart = selectedRange.start === day
              const isEnd = selectedRange.end === day

              let bgColor = 'bg-green-50 border-green-200'
              if (status === 'BOOKED') bgColor = 'bg-amber-50 border-amber-200'
              else if (status === 'BLOCKED') bgColor = 'bg-red-50 border-red-200'
              else if (status === 'INVALID') bgColor = 'bg-gray-100 border-gray-200'

              if (isSelected) bgColor = 'bg-teal-200 border-teal-400'

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  disabled={!blockMode || status === 'INVALID'}
                  className={`aspect-square rounded-lg border p-1 text-xs font-semibold
                             transition-all flex items-center justify-center relative
                             ${bgColor} ${!blockMode || status === 'INVALID' ? 'cursor-default' : 'cursor-pointer hover:shadow-card'}
                             ${isStart ? 'ring-2 ring-teal-600' : ''}
                             ${isEnd ? 'ring-2 ring-teal-600' : ''}
                             ${status === 'INVALID' ? 'opacity-50' : ''}
                             `}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {!blockMode ? (
            <button
              onClick={() => setBlockMode(true)}
              className="w-full bg-primary text-white px-4 py-3 rounded-xl text-sm
                         font-semibold flex items-center justify-center gap-2
                         hover:bg-primary-soft transition-colors"
            >
              <Lock className="w-4 h-4" />
              Chế độ chặn ngày
            </button>
          ) : (
            <div className="space-y-3">
              {selectedRange.start && selectedRange.end && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-teal-900 mb-2">
                    Chọn: Từ ngày {selectedRange.start} đến ngày {selectedRange.end}
                  </p>
                  <p className="text-xs text-teal-700">
                    {Math.abs(selectedRange.end - selectedRange.start) + 1} ngày
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleConfirmBlock}
                  disabled={
                    !selectedRange.start ||
                    !selectedRange.end ||
                    blockMutation.isPending ||
                    unblockMutation.isPending
                  }
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl text-sm
                             font-semibold hover:bg-red-700 transition-colors disabled:opacity-50
                             flex items-center justify-center gap-2"
                >
                  {blockMutation.isPending || unblockMutation.isPending ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Xác nhận
                    </>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  className="flex-1 bg-surface-soft border border-border text-primary px-4 py-3
                             rounded-xl text-sm font-semibold hover:bg-surface-muted transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <h3 className="font-semibold text-blue-900 text-sm mb-2">Lưu ý:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Ngày trống (xanh): Có thể đặt xe</li>
            <li>• Ngày bận (vàng): Đã có đơn đặt</li>
            <li>• Ngày bị chặn (đỏ): Bạn đã chặn hoặc xe bảo dưỡng</li>
            <li>• Chọn 2 ngày để chặn hoặc mở khóa khoảng thời gian</li>
          </ul>
        </div>
      </div>
    </HostLayout>
  )
}
