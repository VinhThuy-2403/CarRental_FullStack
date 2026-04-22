import api from './axiosInstance'

export const adminApi = {
  // ── Dashboard ────────────────────────────────────────
  getDashboard: () =>
    api.get('/admin/dashboard'),

  // ── Cars ─────────────────────────────────────────────
  getPendingCars: (params) =>
    api.get('/admin/cars/pending', { params }),

  getAllCars: (params) =>
    api.get('/admin/cars', { params }),

  getCarDetail: (id) =>
    api.get(`/admin/cars/${id}`),

  approveCar: (id) =>
    api.patch(`/admin/cars/${id}/approve`),

  rejectCar: (id, reason) =>
    api.patch(`/admin/cars/${id}/reject`, { reason }),

  // ── Users ─────────────────────────────────────────────
  getAllUsers: (params) =>
    api.get('/admin/users', { params }),

  getUserActivity: (id) =>
    api.get(`/admin/users/${id}/activity`),

  lockUser: (id) =>
    api.patch(`/admin/users/${id}/lock`),

  unlockUser: (id) =>
    api.patch(`/admin/users/${id}/unlock`),

  // ── Bookings ──────────────────────────────────────────
  getAllBookings: (params) =>
    api.get('/admin/bookings', { params }),
}