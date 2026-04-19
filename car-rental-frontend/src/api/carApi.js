import api from './axiosInstance'

export const carApi = {
  // ── Public ──────────────────────────────────────────
  search: (params) =>
    api.get('/cars', { params }),

  getFeatured: (limit = 6) =>
    api.get('/cars/featured', { params: { limit } }),

  getDetail: (id) =>
    api.get(`/cars/${id}`),

  getAvailability: (id, year, month) =>
    api.get(`/cars/${id}/availability`, { params: { year, month } }),

  // ── Host ────────────────────────────────────────────
  getMyCars: () =>
    api.get('/cars/my-cars'),

  getMyCarDetail: (id) =>
    api.get(`/cars/my-cars/${id}`),

  create: (data) =>
    api.post('/cars', data),

  update: (id, data) =>
    api.put(`/cars/${id}`, data),

  updateStatus: (id, status) =>
    api.patch(`/cars/${id}/status`, { status }),

  delete: (id) =>
    api.delete(`/cars/${id}`),

  uploadImages: (id, files) => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    return api.post(`/cars/${id}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteImage: (carId, imageId) =>
    api.delete(`/cars/${carId}/images/${imageId}`),

  // ── Calendar ────────────────────────────────────────
  getCalendar: (carId, year, month) =>
    api.get(`/cars/${carId}/calendar`, { params: { year, month } }),

  blockDates: (carId, startDate, endDate) =>
    api.post(`/cars/${carId}/calendar/block`, { startDate, endDate }),

  unblockDates: (carId, startDate, endDate) =>
    api.delete(`/cars/${carId}/calendar/block`, { data: { startDate, endDate } }),
}