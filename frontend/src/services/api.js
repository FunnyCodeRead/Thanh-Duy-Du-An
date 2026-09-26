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

export const applicationApi = {
  list: (params = '') => apiRequest(`/api/applications${params}`),
  get: (id) => apiRequest(`/api/applications/${id}`),
  create: (data) => apiRequest('/api/applications', { method: 'POST', body: data }),
  updateStatus: (id, status) => apiRequest(`/api/applications/${id}/status`, { method: 'PUT', body: { status } }),
}

export const interviewApi = {
  list: (params = '') => apiRequest(`/api/interviews${params}`),
  get: (id) => apiRequest(`/api/interviews/${id}`),
  create: (data) => apiRequest('/api/interviews', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/api/interviews/${id}`, { method: 'PUT', body: data }),
  updateStatus: (id, status) => apiRequest(`/api/interviews/${id}/status`, { method: 'PUT', body: { status } }),
  interviewers: () => apiRequest('/api/interviews/interviewers'),
}

export const evaluationApi = {
  listByApplication: (applicationId) => apiRequest(`/api/applications/${applicationId}/evaluations`),
  get: (id) => apiRequest(`/api/evaluations/${id}`),
  create: (data) => apiRequest('/api/evaluations', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/api/evaluations/${id}`, { method: 'PUT', body: data }),
}

export const aiApi = {
  cvSummary: (applicationId) =>
    apiRequest('/api/ai/cv-summary', { method: 'POST', body: { application_id: applicationId } }),
  interviewQuestions: (applicationId) =>
    apiRequest('/api/ai/interview-questions', { method: 'POST', body: { application_id: applicationId } }),
  email: (applicationId, emailType) =>
    apiRequest('/api/ai/email', { method: 'POST', body: { application_id: applicationId, email_type: emailType } }),
  listResults: (applicationId) => apiRequest(`/api/applications/${applicationId}/ai-results`),
}

export function cvUrl(storedPath) {
  if (!storedPath) return null
  const filename = String(storedPath).replaceAll('\\', '/').split('/').pop()
  return `/uploads/${encodeURIComponent(filename)}`
}


