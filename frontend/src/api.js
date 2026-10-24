import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1', headers: { 'Content-Type': 'application/json' } })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('library_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
}
export const bookApi = {
  all: () => api.get('/books'),
  detail: (id) => api.get(`/books/${id}`),
  categories: () => api.get('/categories'),
}
export const loanApi = { mine: () => api.get('/loans/my-loans') }
export function getErrorMessage(error) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.'
}
export default api
