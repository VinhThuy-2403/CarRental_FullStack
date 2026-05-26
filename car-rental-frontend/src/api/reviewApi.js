import axiosInstance from './axiosInstance'

export const reviewApi = {
  create: (data) => axiosInstance.post('/reviews', data),
  getByCar: (carId, params) => axiosInstance.get(`/reviews/car/${carId}`, { params }),
  getByBooking: (bookingId) => axiosInstance.get(`/reviews/booking/${bookingId}`),
  reply: (id, data) => axiosInstance.patch(`/reviews/${id}/reply`, data),
}