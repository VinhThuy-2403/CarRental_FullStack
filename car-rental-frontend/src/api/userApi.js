import api from './axiosInstance'

export const userApi = {
  getProfile: () =>
    api.get('/users/me'),

  updateProfile: (data) =>
    api.put('/users/me', data),

  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.patch('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getPublicProfile: (id) =>
    api.get(`/users/${id}/public`),
}