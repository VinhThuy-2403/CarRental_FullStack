import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, X, Loader, ImagePlus, Star } from 'lucide-react'
import { carApi } from '@/api/carApi'
import HostLayout from '@/components/layout/HostLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import toast from 'react-hot-toast'

// ─── Constants ───────────────────────────────────────────────────────────────

const PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng',
  'Cần Thơ', 'Nha Trang', 'Đà Lạt', 'Vũng Tàu', 'Huế',
  'Hội An', 'Quảng Ninh', 'Bình Dương', 'Đồng Nai',
]

const FEATURE_OPTIONS = [
  { value: 'AirConditioner', label: 'Điều hòa' },
  { value: 'GPS',            label: 'GPS' },
  { value: 'RearCamera',     label: 'Camera lùi' },
  { value: 'LeatherSeat',    label: 'Ghế da' },
  { value: 'Sunroof',        label: 'Cửa sổ trời' },
  { value: 'ABS',            label: 'Phanh ABS' },
  { value: 'EBS',            label: 'Hỗ trợ phanh EBS' },
  { value: 'Bluetooth',      label: 'Bluetooth' },
  { value: 'USBCharging',    label: 'Sạc USB' },
  { value: 'Dashboard',      label: 'Màn hình HUD' },
]

// ─── Validation schema ────────────────────────────────────────────────────────

const schema = z.object({
  licensePlate: z.string().min(1, 'Biển số xe không được để trống').max(20),
  brand:        z.string().min(1, 'Hãng xe không được để trống'),
  model:        z.string().min(1, 'Model không được để trống'),
  year:         z.coerce.number().min(2000, 'Từ năm 2000').max(new Date().getFullYear() + 1),
  color:        z.string().optional(),
  seats:        z.coerce.number().min(2).max(16),
  fuelType:     z.enum(['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID']),
  transmission: z.enum(['AUTOMATIC', 'MANUAL']),
  description:  z.string().min(10, 'Mô tả tối thiểu 10 ký tự'),
  features:     z.array(z.string()).default([]),
  pricePerDay:  z.coerce.number().min(100000, 'Giá thuê tối thiểu 100.000đ'),
  deposit:      z.coerce.number().min(0),
  kmLimitPerDay: z.coerce.number().min(0),
  province:     z.string().min(1, 'Tỉnh/Thành phố không được để trống'),
  district:     z.string().optional(),
})

// ─── Helper: input class ─────────────────────────────────────────────────────

const inputCls = `w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-teal-400/25
                  focus:border-teal-400 hover:border-border-strong transition-all`

const labelCls = `block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5`

// ─── Component ───────────────────────────────────────────────────────────────

export default function CarFormPage() {
  const { id }         = useParams()
  const navigate       = useNavigate()
  const queryClient    = useQueryClient()
  const fileInputRef   = useRef(null)
  const isEdit         = !!id

  // Ảnh đã upload lên server (chỉ có khi edit)
  const [uploadedImages, setUploadedImages] = useState([])
  // Ảnh mới chọn từ máy, chưa upload (cả create lẫn edit)
  const [pendingFiles, setPendingFiles]     = useState([])
  // Preview URLs cho pendingFiles
  const [previewUrls, setPreviewUrls]       = useState([])

  // ── Load xe khi edit ──────────────────────────────────
  const { data: carRes, isLoading: loadingCar } = useQuery({
    queryKey: ['my-car', id],
    queryFn:  () => carApi.getMyCarDetail(id),
    enabled:  isEdit,
  })
  const car = carRes?.data?.data

  // ── Form ──────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      licensePlate:  '',
      brand:         '',
      model:         '',
      year:          new Date().getFullYear(),
      color:         '',
      seats:         5,
      fuelType:      'GASOLINE',
      transmission:  'AUTOMATIC',
      description:   '',
      features:      [],
      pricePerDay:   500000,
      deposit:       0,
      kmLimitPerDay: 300,
      province:      '',
      district:      '',
    },
  })

  // Điền form khi edit
  useEffect(() => {
    if (isEdit && car) {
      reset({
        licensePlate:  car.licensePlate  || '',
        brand:         car.brand         || '',
        model:         car.model         || '',
        year:          car.year          || new Date().getFullYear(),
        color:         car.color         || '',
        seats:         car.seats         || 5,
        fuelType:      car.fuelType      || 'GASOLINE',
        transmission:  car.transmission  || 'AUTOMATIC',
        description:   car.description   || '',
        features:      car.features      || [],
        pricePerDay:   car.pricePerDay   || 500000,
        deposit:       car.deposit       || 0,
        kmLimitPerDay: car.kmLimitPerDay || 300,
        province:      car.province      || '',
        district:      car.district      || '',
      })
      setUploadedImages(car.images || [])
    }
  }, [car, isEdit, reset])

  // Cleanup preview URLs khi component unmount
  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [previewUrls])

  // ── Mutations ─────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data) => carApi.create(data),
    onSuccess: async (res) => {
      const newCarId = res.data?.data?.id
      // Nếu có ảnh chờ upload thì upload luôn sau khi tạo xe
      if (pendingFiles.length > 0 && newCarId) {
        try {
          await carApi.uploadImages(newCarId, pendingFiles)
          toast.success('Đăng xe & upload ảnh thành công! Đang chờ xét duyệt.')
        } catch {
          toast.success('Đăng xe thành công! Nhưng upload ảnh thất bại — bạn có thể thêm ảnh sau.')
        }
      } else {
        toast.success('Đăng xe thành công! Đang chờ xét duyệt.')
      }
      queryClient.invalidateQueries(['my-cars'])
      navigate('/host/cars', { replace: true })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Đăng xe thất bại')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data) => carApi.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật xe thành công!')
      queryClient.invalidateQueries(['my-cars'])
      queryClient.invalidateQueries(['my-car', id])
      navigate('/host/cars', { replace: true })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (files) => carApi.uploadImages(id, files),
    onSuccess: (res) => {
      const newImgs = res.data?.data?.images || []
      setUploadedImages(newImgs)
      setPendingFiles([])
      setPreviewUrls([])
      toast.success(`Upload ${pendingFiles.length} ảnh thành công!`)
      queryClient.invalidateQueries(['my-car', id])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Upload ảnh thất bại')
    },
  })

  const deleteImageMutation = useMutation({
    mutationFn: (imageId) => carApi.deleteImage(id, imageId),
    onSuccess: (_, imageId) => {
      // Fix: filter đúng bằng imageId
      setUploadedImages((prev) => prev.filter((img) => img.id !== imageId))
      toast.success('Xóa ảnh thành công!')
    },
    onError: () => toast.error('Xóa ảnh thất bại'),
  })

  // ── Handlers ──────────────────────────────────────────

  const handleFileSelect = (e) => {
    const selected   = Array.from(e.target.files || [])
    const totalAfter = uploadedImages.length + pendingFiles.length + selected.length
    if (totalAfter > 10) {
      toast.error(`Tối đa 10 ảnh. Hiện có ${uploadedImages.length + pendingFiles.length}, chỉ thêm được ${10 - uploadedImages.length - pendingFiles.length} ảnh nữa.`)
      return
    }
    const validFiles = selected.filter((f) => f.type.startsWith('image/'))
    if (validFiles.length !== selected.length) {
      toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)')
    }
    setPendingFiles((prev) => [...prev, ...validFiles])
    setPreviewUrls((prev) => [...prev, ...validFiles.map((f) => URL.createObjectURL(f))])
    // Reset input để có thể chọn lại cùng file
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePending = (idx) => {
    URL.revokeObjectURL(previewUrls[idx])
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleUploadPending = () => {
    if (pendingFiles.length === 0) return
    uploadMutation.mutate(pendingFiles)
  }

  const onSubmit = (data) => {
    if (isEdit) updateMutation.mutate(data)
    else        createMutation.mutate(data)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  // ── Render ────────────────────────────────────────────

  if (isEdit && loadingCar) {
    return (
      <HostLayout>
        <div className="flex items-center justify-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      </HostLayout>
    )
  }

  const totalImages   = uploadedImages.length + pendingFiles.length
  const canAddMore    = totalImages < 10

  return (
    <HostLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-1">
            {isEdit ? 'Chỉnh sửa xe' : 'Đăng xe mới'}
          </h1>
          <p className="text-primary-muted text-sm">
            {isEdit
              ? 'Thay đổi thông tin sẽ gửi xe về trạng thái chờ duyệt lại'
              : 'Điền đầy đủ thông tin để đăng xe cho thuê'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ── Section 1: Ảnh xe ────────────────────────── */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-primary">Ảnh xe</h2>
                <p className="text-xs text-primary-subtle mt-0.5">
                  {isEdit
                    ? `${totalImages}/10 ảnh · Ảnh đầu tiên sẽ là ảnh chính`
                    : `${pendingFiles.length}/10 ảnh · Có thể thêm ảnh sau khi đăng xe`}
                </p>
              </div>
              {isEdit && pendingFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleUploadPending}
                  disabled={uploadMutation.isPending}
                  className="btn-teal flex items-center gap-2 text-sm px-4 py-2"
                >
                  {uploadMutation.isPending ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploadMutation.isPending ? 'Đang tải...' : `Tải lên ${pendingFiles.length} ảnh`}
                </button>
              )}
            </div>

            {/* Grid ảnh đã upload (edit mode) */}
            {isEdit && uploadedImages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-2">
                  Ảnh hiện tại
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {uploadedImages.map((img, idx) => (
                    <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-surface-muted">
                      <img
                        src={img.url}              // ← fix: img.url (không phải img.imageUrl)
                        alt={`Ảnh xe ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Badge ảnh chính */}
                      {img.isPrimary && (
                        <div className="absolute bottom-1 left-1 bg-teal-400 text-white
                                        text-xs font-semibold px-1.5 py-0.5 rounded-md
                                        flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-white" />
                          Chính
                        </div>
                      )}
                      {/* Nút xóa */}
                      <button
                        type="button"
                        onClick={() => deleteImageMutation.mutate(img.id)}
                        disabled={deleteImageMutation.isPending}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white
                                   rounded-full flex items-center justify-center
                                   opacity-0 group-hover:opacity-100 transition-opacity
                                   hover:bg-red-600 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grid ảnh đang chờ upload */}
            {pendingFiles.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-2">
                  {isEdit ? 'Ảnh chờ tải lên' : 'Ảnh đã chọn'}
                  {!isEdit && (
                    <span className="ml-2 text-teal-600 font-normal normal-case tracking-normal">
                      (sẽ tự động tải lên sau khi đăng xe)
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-surface-muted border-2 border-dashed border-teal-200">
                      <img
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Badge ảnh chính (ảnh đầu tiên khi create) */}
                      {!isEdit && idx === 0 && (
                        <div className="absolute bottom-1 left-1 bg-teal-400 text-white
                                        text-xs font-semibold px-1.5 py-0.5 rounded-md
                                        flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-white" />
                          Chính
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removePending(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white
                                   rounded-full flex items-center justify-center
                                   opacity-0 group-hover:opacity-100 transition-opacity
                                   hover:bg-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload zone */}
            {canAddMore && (
              <label className="flex flex-col items-center justify-center w-full py-8
                                border-2 border-dashed border-border rounded-xl cursor-pointer
                                hover:border-teal-400 hover:bg-teal-50/30 transition-all duration-150 group">
                <ImagePlus className="w-8 h-8 text-primary-subtle group-hover:text-teal-500 mb-2 transition-colors" />
                <span className="text-sm font-semibold text-primary group-hover:text-teal-600 transition-colors">
                  Nhấn để chọn ảnh
                </span>
                <span className="text-xs text-primary-subtle mt-1">
                  JPG, PNG, WEBP · Tối đa 5MB mỗi ảnh · Còn {10 - totalImages} slot
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}

            {!canAddMore && (
              <p className="text-center text-xs text-primary-subtle py-3">
                Đã đạt tối đa 10 ảnh. Xóa ảnh cũ để thêm ảnh mới.
              </p>
            )}
          </div>

          {/* ── Section 2: Thông tin cơ bản ─────────────── */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-primary mb-4">Thông tin cơ bản</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className={labelCls}>Biển số xe</label>
                <input {...register('licensePlate')} placeholder="51A-123.45"
                  className={inputCls} />
                {errors.licensePlate && <p className="text-red-500 text-xs mt-1">{errors.licensePlate.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Hãng xe</label>
                <input {...register('brand')} placeholder="Toyota" className={inputCls} />
                {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Model</label>
                <input {...register('model')} placeholder="Camry" className={inputCls} />
                {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Năm sản xuất</label>
                <input {...register('year')} type="number" min={2000} max={new Date().getFullYear() + 1}
                  className={inputCls} />
                {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Màu sắc</label>
                <input {...register('color')} placeholder="Đen" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Số chỗ ngồi</label>
                <select {...register('seats')} className={inputCls}>
                  {[2, 4, 5, 6, 7, 9, 12, 16].map((n) => (
                    <option key={n} value={n}>{n} chỗ</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Loại nhiên liệu</label>
                <select {...register('fuelType')} className={inputCls}>
                  <option value="GASOLINE">Xăng</option>
                  <option value="DIESEL">Dầu diesel</option>
                  <option value="ELECTRIC">Điện</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Hộp số</label>
                <select {...register('transmission')} className={inputCls}>
                  <option value="AUTOMATIC">Số tự động</option>
                  <option value="MANUAL">Số sàn</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Tỉnh / Thành phố giao xe</label>
                <select {...register('province')} className={inputCls}>
                  <option value="">Chọn tỉnh/thành phố</option>
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
                {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Quận / Huyện (tuỳ chọn)</label>
                <input {...register('district')} placeholder="Quận 1" className={inputCls} />
              </div>
            </div>
          </div>

          {/* ── Section 3: Mô tả & Tính năng ────────────── */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-primary mb-4">Mô tả và tính năng</h2>

            <div className="mb-5">
              <label className={labelCls}>Mô tả xe</label>
              <textarea
                {...register('description')}
                placeholder="Mô tả tình trạng xe, điểm đặc biệt, lưu ý khi nhận xe..."
                rows={4}
                className={`${inputCls} resize-none`}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Tính năng xe</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {FEATURE_OPTIONS.map((f) => (
                  <label key={f.value}
                    className="flex items-center gap-2 cursor-pointer px-3 py-2
                               rounded-lg border border-border hover:border-teal-300
                               hover:bg-teal-50/30 transition-all duration-150">
                    <input
                      type="checkbox"
                      value={f.value}
                      {...register('features')}
                      className="w-4 h-4 rounded border-border accent-teal-600"
                    />
                    <span className="text-sm text-primary">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── Section 4: Giá thuê ──────────────────────── */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-primary mb-4">Giá thuê & Điều kiện</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <div>
                <label className={labelCls}>Giá thuê / ngày (VNĐ)</label>
                <input
                  {...register('pricePerDay')}
                  type="number"
                  min={100000}
                  step={50000}
                  className={inputCls}
                />
                {errors.pricePerDay && <p className="text-red-500 text-xs mt-1">{errors.pricePerDay.message}</p>}
                {watch('pricePerDay') > 0 && (
                  <p className="text-teal-600 text-xs mt-1">
                    ≈ {Number(watch('pricePerDay')).toLocaleString('vi-VN')}đ
                  </p>
                )}
              </div>

              <div>
                <label className={labelCls}>Tiền đặt cọc (VNĐ)</label>
                <input
                  {...register('deposit')}
                  type="number"
                  min={0}
                  step={100000}
                  className={inputCls}
                />
                {watch('deposit') > 0 && (
                  <p className="text-primary-subtle text-xs mt-1">
                    ≈ {Number(watch('deposit')).toLocaleString('vi-VN')}đ
                  </p>
                )}
              </div>

              <div>
                <label className={labelCls}>Giới hạn km / ngày</label>
                <input
                  {...register('kmLimitPerDay')}
                  type="number"
                  min={0}
                  step={50}
                  className={inputCls}
                />
                <p className="text-primary-subtle text-xs mt-1">0 = không giới hạn</p>
              </div>
            </div>
          </div>

          {/* ── Actions ──────────────────────────────────── */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 text-base"
            >
              {isSaving && <Loader className="w-4 h-4 animate-spin" />}
              {isSaving
                ? 'Đang xử lý...'
                : isEdit
                  ? 'Lưu thay đổi'
                  : pendingFiles.length > 0
                    ? `Đăng xe + ${pendingFiles.length} ảnh`
                    : 'Đăng xe'
              }
            </button>
            <button
              type="button"
              onClick={() => navigate('/host/cars')}
              className="btn-secondary px-8 py-3 text-base"
            >
              Hủy
            </button>
          </div>

        </form>
      </div>
    </HostLayout>
  )
}