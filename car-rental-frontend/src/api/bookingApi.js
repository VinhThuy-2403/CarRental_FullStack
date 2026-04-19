import api from './axiosInstance'

export const bookingApi = {
  // ── Customer ────────────────────────────────────────────
  create: (data) =>
    api.post('/bookings', data),

  getMyBookings: (params) =>
    api.get('/bookings/my-bookings', { params }),

  getDetail: (id) =>
    api.get(`/bookings/${id}`),

  cancel: (id, reason) =>
    api.patch(`/bookings/${id}/cancel`, { reason }),

  // ── Host ────────────────────────────────────────────────
  getIncomingBookings: (params) =>
    api.get('/bookings/host/incoming', { params }),

  confirm: (id) =>
    api.patch(`/bookings/${id}/confirm`, {}),

  reject: (id, reason) =>
    api.patch(`/bookings/${id}/reject`, { reason }),

  complete: (id) =>
    api.patch(`/bookings/${id}/complete`, {}),
}
