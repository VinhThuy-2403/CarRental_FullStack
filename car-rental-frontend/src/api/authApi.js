import api from './axiosInstance'

export const authApi = {
  register: (data) =>
    api.post('/auth/register', data),

  login: (data) =>
    api.post('/auth/login', data),

  logout: (refreshToken) =>
    api.post('/auth/logout', { refreshToken }),

  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password', { token, newPassword }),

  changePassword: (currentPassword, newPassword) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),
}