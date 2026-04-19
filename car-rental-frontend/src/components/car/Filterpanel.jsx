import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'

const PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng',
  'Cần Thơ', 'Nha Trang', 'Đà Lạt', 'Vũng Tàu',
  'Huế', 'Hội An', 'Quảng Ninh', 'Bình Dương',
]

const SEATS_OPTIONS  = [2, 4, 5, 7, 9, 12, 16]
const TRANS_OPTIONS  = [{ value: 'AUTOMATIC', label: 'Số tự động' }, { value: 'MANUAL', label: 'Số sàn' }]
const FUEL_OPTIONS   = [
  { value: 'GASOLINE', label: 'Xăng' },
  { value: 'DIESEL',   label: 'Dầu diesel' },
  { value: 'ELECTRIC', label: 'Điện' },
  { value: 'HYBRID',   label: 'Hybrid' },
]

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-sm font-semibold
                   text-primary mb-3 hover:text-teal-600 transition-colors"
      >
        {title}
        {open
          ? <ChevronUp className="w-4 h-4 text-primary-subtle" />
          : <ChevronDown className="w-4 h-4 text-primary-subtle" />
        }
      </button>
      {open && children}
    </div>
  )
}

export default function FilterPanel({ filters, onChange }) {
  const set = (key, val) => onChange({ ...filters, [key]: val })
  const toggle = (key, val) => {
    set(key, filters[key] === val ? undefined : val)
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h2 className="text-base font-bold text-primary mb-5">Bộ lọc</h2>

      {/* Tỉnh/thành */}
      <Section title="Địa điểm">
        <select
          value={filters.province || ''}
          onChange={(e) => set('province', e.target.value || undefined)}
          className="input-base"
        >
          <option value="">Tất cả tỉnh/thành</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </Section>

      {/* Khoảng giá */}
      <Section title="Giá thuê / ngày">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-primary-subtle mb-1 block">Từ (đ)</label>
            <input
              type="number"
              placeholder="100,000"
              value={filters.minPrice || ''}
              onChange={(e) => set('minPrice', e.target.value || undefined)}
              className="input-base"
              min={0}
              step={50000}
            />
          </div>
          <div>
            <label className="text-xs text-primary-subtle mb-1 block">Đến (đ)</label>
            <input
              type="number"
              placeholder="5,000,000"
              value={filters.maxPrice || ''}
              onChange={(e) => set('maxPrice', e.target.value || undefined)}
              className="input-base"
              min={0}
              step={50000}
            />
          </div>
        </div>
      </Section>

      {/* Số chỗ */}
      <Section title="Số chỗ ngồi">
        <div className="flex flex-wrap gap-2">
          {SEATS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => toggle('seats', s)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150',
                filters.seats === s
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-primary-muted hover:border-border-strong'
              )}
            >
              {s} chỗ
            </button>
          ))}
        </div>
      </Section>

      {/* Hộp số */}
      <Section title="Hộp số">
        <div className="flex flex-col gap-2">
          {TRANS_OPTIONS.map((t) => (
            <label key={t.value} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                onClick={() => toggle('transmission', t.value)}
                className={clsx(
                  'w-4 h-4 rounded border flex items-center justify-center transition-all',
                  filters.transmission === t.value
                    ? 'bg-primary border-primary'
                    : 'border-border-strong group-hover:border-primary'
                )}
              >
                {filters.transmission === t.value && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-sm text-primary">{t.label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Nhiên liệu */}
      <Section title="Nhiên liệu">
        <div className="flex flex-col gap-2">
          {FUEL_OPTIONS.map((f) => (
            <label key={f.value} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                onClick={() => toggle('fuelType', f.value)}
                className={clsx(
                  'w-4 h-4 rounded border flex items-center justify-center transition-all',
                  filters.fuelType === f.value
                    ? 'bg-primary border-primary'
                    : 'border-border-strong group-hover:border-primary'
                )}
              >
                {filters.fuelType === f.value && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-sm text-primary">{f.label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Reset */}
      <button
        onClick={() => onChange({})}
        className="w-full mt-2 text-sm text-primary-subtle hover:text-red-500
                   transition-colors font-medium"
      >
        Xóa tất cả bộ lọc
      </button>
    </div>
  )
}