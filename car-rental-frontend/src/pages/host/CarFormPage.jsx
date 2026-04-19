import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, X, Loader } from 'lucide-react'
import { carApi } from '@/api/carApi'
import MainLayout from '@/components/layout/MainLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import HostLayout from '../../components/layout/HostLayout'

const PROVINCES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Nha Trang',
  'Đà Lạt',
  'Vũng Tàu',
  'Huế',
]

const schema = z.object({
  licensePlate: z.string().min(1, 'Biển số xe không được để trống'),
  brand: z.string().min(1, 'Hãng xe không được để trống'),
  model: z.string().min(1, 'Model không được để trống'),
  year: z.coerce.number().min(1990).max(new Date().getFullYear()),
  color: z.string().min(1, 'Màu sắc không được để trống'),
  seats: z.coerce.number().min(2).max(12),
  fuelType: z.enum(['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID']),
  transmission: z.enum(['AUTOMATIC', 'MANUAL']),
  description: z.string().min(10, 'Mô tả phải tối thiểu 10 ký tự'),
  features: z.array(z.string()),
  pricePerDay: z.coerce.number().min(100000, 'Giá phải từ 100.000đ trở lên'),
  deposit: z.coerce.number().min(0),
  limitKmPerDay: z.coerce.number().min(0),
  province: z.string().min(1, 'Tỉnh/Thành phố không được để trống'),
})

const FEATURE_OPTIONS = [
  { value: 'AirConditioner', label: 'Điều hòa' },
  { value: 'GPS', label: 'GPS' },
  { value: 'RearCamera', label: 'Camera lùi' },
  { value: 'LeatherSeat', label: 'Ghế da' },
  { value: 'Sunroof', label: 'Cửa sổ trời' },
  { value: 'ABS', label: 'ABS' },
  { value: 'EBS', label: 'EBS' },
  { value: 'Bluetooth', label: 'Bluetooth' },
  { value: 'USBCharging', label: 'Sạc USB' },
  { value: 'Dashboard', label: 'Hành trình kỹ thuật số' },
]

export default function CarFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id
  const [uploadedImages, setUploadedImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)

  const { data: carRes, isLoading: loadingCar } = useQuery({
    queryKey: ['car', id],
    queryFn: () => carApi.getMyCarDetail(id),
    enabled: isEdit,
  })

  const car = carRes?.data?.data

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      licensePlate: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      seats: 5,
      fuelType: 'GASOLINE',
      transmission: 'AUTOMATIC',
      description: '',
      features: [],
      pricePerDay: 500000,
      deposit: 0,
      limitKmPerDay: 0,
      province: '',
    },
  })

  useEffect(() => {
    if (isEdit && car) {
      reset({
        licensePlate: car.licensePlate || '',
        brand: car.brand || '',
        model: car.model || '',
        year: car.year || new Date().getFullYear(),
        color: car.color || '',
        seats: car.seats || 5,
        fuelType: car.fuelType || 'GASOLINE',
        transmission: car.transmission || 'AUTOMATIC',
        description: car.description || '',
        features: car.features || [],
        pricePerDay: car.pricePerDay || 500000,
        deposit: car.deposit || 0,
        limitKmPerDay: car.limitKmPerDay || 0,
        province: car.province || '',
      })
      setUploadedImages(car.images || [])
    }
  }, [car, isEdit, reset])

  const createMutation = useMutation({
    mutationFn: (data) => carApi.create(data),
    onSuccess: (res) => {
      toast.success('Đăng xe thành công! Đang chờ xét duyệt...')
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
      queryClient.invalidateQueries(['car', id])
      navigate('/host/cars', { replace: true })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại')
    },
  })

  const uploadImagesMutation = useMutation({
    mutationFn: (files) => carApi.uploadImages(id, files),
    onSuccess: (res) => {
      toast.success('Tải ảnh lên thành công!')
      setUploadedImages((prev) => [...prev, ...(res.data?.data || [])])
      setNewImages([])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Tải ảnh thất bại')
    },
  })

  const deleteImageMutation = useMutation({
    mutationFn: (imageId) => carApi.deleteImage(id, imageId),
    onSuccess: () => {
      toast.success('Xóa ảnh thành công!')
      setUploadedImages((prev) => prev.filter((img) => img.id))
    },
    onError: (err) => {
      toast.error('Xóa ảnh thất bại')
    },
  })

  const onSubmit = async (data) => {
    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(data)
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || [])
    const currentTotal = uploadedImages.length + newImages.length + files.length
    if (currentTotal > 10) {
      toast.error('Tối đa 10 ảnh')
      return
    }
    setNewImages((prev) => [...prev, ...files])
  }

  const handleUploadNewImages = async () => {
    if (newImages.length === 0) {
      toast.error('Chưa chọn ảnh')
      return
    }
    if (!isEdit) {
      toast.error('Vui lòng tạo xe trước')
      return
    }
    setUploadingImages(true)
    uploadImagesMutation.mutate(newImages)
    setUploadingImages(false)
  }

  if (isEdit && loadingCar) return <LoadingSpinner />

  return (
    <HostLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {isEdit ? 'Chỉnh sửa xe' : 'Đăng xe mới'}
          </h1>
          <p className="text-primary-muted">
            {isEdit
              ? 'Cập nhật thông tin xe thuê của bạn'
              : 'Điền đầy đủ thông tin để đăng xe'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Thông tin cơ bản */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-primary mb-4">Thông tin cơ bản</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Biển số xe */}
              <div>
                <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                  Biển số xe
                </label>
                <input
                  {...register('licensePlate')}
                  placeholder="VN1234AA"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                             focus:border-teal-400 transition-all"
                />
                {errors.licensePlate && (
                  <p className="text-red-500 text-xs mt-1">{errors.licensePlate.message}</p>
                )}
              </div>

              {/* Hãng xe */}
              <div>
                <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                  Hãng xe
                </label>
                <input
                  {...register('brand')}
                  placeholder="Toyota"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                             focus:border-teal-400 transition-all"
                />
                {errors.brand && (
                  <p className="text-red-500 text-xs mt-1">{errors.brand.message}</p>
                )}
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                  Model
                </label>
                <input
                  {...register('model')}
                  placeholder="Camry"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                             focus:border-teal-400 transition-all"
                />
                {errors.model && (
                  <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>
                )}
              </div>

              {/* Năm sản xuất */}
              <div>
                <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                  Năm sản xuất
                </label>
                <input
                  {...register('year')}
                  type="number"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                             focus:border-teal-400 transition-all"
                />
                {errors.year && (
                  <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>
                )}
              </div>

              {/* Màu sắc */}
              <div>
                <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                  Màu sắc
                </label>
                <input
                  {...register('color')}
                  placeholder="Đen"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                             focus:border-teal-400 transition-all"
                />
                {errors.color && (
                  <p className="text-red-500 text-xs mt-1">{errors.color.message}</p>
                )}
              </div>

              {/* Số chỗ */}
              <div>
                <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                  Số chỗ ngồi
                </label>
                <select
                  {...register('seats')}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                             focus:border-teal-400 transition-all appearance-none cursor-pointer"
                >
                  {[2, 4, 5, 6, 7, 8, 9, 12].map((n) => (
                    <option key={n} value={n}>
                      {n} chỗ
                    </option>
                  ))}
                </select>
              </div>

              {/* Loại nhiên liệu */}
              <div>
                <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                  Loại nhiên liệu
                </label>
                <select
                  {...register('fuelType')}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                             focus:border-teal-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="GASOLINE">Xăng</option>
                  <option value="DIESEL">Dầu diesel</option>
                  <option value="ELECTRIC">Điện</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>

              {/* Hộp số */}
              <div>
                <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                  Hộp số
                </label>
                <select
                  {...register('transmission')}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                             focus:border-teal-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="AUTOMATIC">Tự động</option>
                  <option value="MANUAL">Số sàn</option>
                </select>
              </div>

              {/* Tỉnh/Thành phố */}
              <div>
                <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                  Tỉnh/Thành phố giao xe
                </label>
                <select
                  {...register('province')}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                             focus:border-teal-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                {errors.province && (
                  <p className="text-red-500 text-xs mt-1">{errors.province.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Mô tả và tính năng */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-primary mb-4">Mô tả và tính năng</h2>

            {/* Mô tả */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                Mô tả xe
              </label>
              <textarea
                {...register('description')}
                placeholder="Mô tả chi tiết về tình trạng xe, tính năng đặc biệt..."
                rows={4}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                           text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                           focus:border-teal-400 transition-all resize-none"
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Tính năng */}
            <div>
              <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-2">
                Tính năng xe
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {FEATURE_OPTIONS.map((feature) => (
                  <label key={feature.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={feature.value}
                      {...register('features')}
                      className="w-4 h-4 rounded border-border accent-teal-600"
                    />
                    <span className="text-sm text-primary">{feature.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Giá thuê */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-primary mb-4">Giá thuê</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Giá/ngày */}
              <div>
                <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                  Giá thuê/ngày (VNĐ)
                </label>
                <input
                  {...register('pricePerDay')}
                  type="number"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                             focus:border-teal-400 transition-all"
                />
                {errors.pricePerDay && (
                  <p className="text-red-500 text-xs mt-1">{errors.pricePerDay.message}</p>
                )}
              </div>

              {/* Đặt cọc */}
              <div>
                <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                  Đặt cọc (VNĐ)
                </label>
                <input
                  {...register('deposit')}
                  type="number"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                             focus:border-teal-400 transition-all"
                />
              </div>

              {/* Giới hạn km */}
              <div>
                <label className="block text-xs font-semibold text-primary-subtle uppercase tracking-wider mb-1.5">
                  Giới hạn km/ngày (0 = không giới hạn)
                </label>
                <input
                  {...register('limitKmPerDay')}
                  type="number"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/25
                             focus:border-teal-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Ảnh xe */}
          {isEdit && (
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h2 className="text-lg font-bold text-primary mb-4">
                Ảnh xe ({uploadedImages.length}/10)
              </h2>

              {/* Ảnh đã tải lên */}
              {uploadedImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-primary mb-3">Ảnh hiện tại</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img.imageUrl}
                          alt={`Car ${idx}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            deleteImageMutation.mutate(img.id)
                          }
                          className="absolute top-1 right-1 bg-red-600 text-white p-1
                                     rounded-full opacity-0 group-hover:opacity-100
                                     transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ảnh chờ tải */}
              {newImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-primary mb-3">Ảnh chờ tải lên</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {newImages.map((file, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${idx}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewImages((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="absolute top-1 right-1 bg-red-600 text-white p-1
                                     rounded-full opacity-0 group-hover:opacity-100
                                     transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload input */}
              {uploadedImages.length < 10 && (
                <label className="flex items-center justify-center w-full p-6 border-2
                                 border-dashed border-border rounded-xl cursor-pointer
                                 hover:bg-surface-soft transition-colors"
                >
                  <div className="flex flex-col items-center">
                    <Upload className="w-6 h-6 text-primary-subtle mb-2" />
                    <span className="text-sm font-medium text-primary">
                      Click để chọn ảnh
                    </span>
                    <span className="text-xs text-primary-subtle">
                      Tối đa 10 ảnh, JPG/PNG
                    </span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}

              {/* Upload button */}
              {newImages.length > 0 && (
                <button
                  type="button"
                  onClick={handleUploadNewImages}
                  disabled={uploadingImages || uploadImagesMutation.isPending}
                  className="mt-4 w-full bg-blue-600 text-white px-4 py-3 rounded-xl
                             text-sm font-semibold hover:bg-blue-700 transition-colors
                             disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploadingImages || uploadImagesMutation.isPending ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Tải {newImages.length} ảnh lên
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-primary text-white px-6 py-3 rounded-xl text-sm
                         font-semibold hover:bg-primary-soft transition-colors disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 animate-spin inline mr-2" />
                  Đang xử lý...
                </>
              ) : isEdit ? (
                'Cập nhật xe'
              ) : (
                'Đăng xe'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/host/cars')}
              className="flex-1 bg-surface-soft border border-border text-primary px-6 py-3
                         rounded-xl text-sm font-semibold hover:bg-surface-muted transition-colors"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </HostLayout>
  )
}
