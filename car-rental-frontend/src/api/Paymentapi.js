import api from './axiosInstance'

export const paymentApi = {
  createVNPay: (bookingId) =>
    api.post(`/payments/vnpay/create?bookingId=${bookingId}`),

  createMoMo: (bookingId) =>
    api.post(`/payments/momo/create?bookingId=${bookingId}`),

  getByBooking: (bookingId) =>
    api.get(`/payments/booking/${bookingId}`),
}