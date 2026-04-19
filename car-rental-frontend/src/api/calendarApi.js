import api from './axiosInstance'

export const calendarApi = {
  // ── Host ────────────────────────────────────────────────
  getCalendar: (carId, year, month) =>
    api.get(`/cars/${carId}/calendar`, { params: { year, month } }),

  blockDates: (carId, startDate, endDate) =>
    api.post(`/cars/${carId}/calendar/block`, { startDate, endDate }),

  unblockDates: (carId, startDate, endDate) =>
    api.delete(`/cars/${carId}/calendar/block`, { data: { startDate, endDate } }),
}
