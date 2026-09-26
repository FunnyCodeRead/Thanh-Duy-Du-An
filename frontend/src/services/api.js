export async function apiRequest(path, options = {}) {
  const config = { credentials: 'include', ...options, headers: { ...(options.headers || {}) } }
  if (options.body && !(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
    config.body = JSON.stringify(options.body)
  }
  const response = await fetch(path, config)
  const payload = await response.json().catch(() => ({ success: false, message: 'Phản hồi từ máy chủ không hợp lệ.' }))
  if (!response.ok) {
    const error = new Error(payload.message || 'Không thể xử lý yêu cầu.')
    error.status = response.status
    throw error
  }
  return payload
}

export const authApi = {
  login: (email, password) => apiRequest('/api/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  me: () => apiRequest('/api/auth/me'),
}

export const jobApi = {
  list: (params = '') => apiRequest(`/api/jobs${params}`),
  get: (id) => apiRequest(`/api/jobs/${id}`),
  create: (data) => apiRequest('/api/jobs', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/api/jobs/${id}`, { method: 'PUT', body: data }),
  remove: (id) => apiRequest(`/api/jobs/${id}`, { method: 'DELETE' }),
}

export const candidateApi = {
  list: (params = '') => apiRequest(`/api/candidates${params}`),
  get: (id) => apiRequest(`/api/candidates/${id}`),
  create: (data) => apiRequest('/api/candidates', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/api/candidates/${id}`, { method: 'PUT', body: data }),
  remove: (id) => apiRequest(`/api/candidates/${id}`, { method: 'DELETE' }),
}

export function cvUrl(storedPath) {
  if (!storedPath) return null
  const filename = String(storedPath).replaceAll('\\', '/').split('/').pop()
  return `/uploads/${encodeURIComponent(filename)}`
}
