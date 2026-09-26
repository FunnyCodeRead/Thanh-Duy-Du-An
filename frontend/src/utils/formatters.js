/**
 * Bộ chuyển đổi hiển thị tiếng Việt cho toàn bộ hệ thống Tuyển dụng AI.
 * Giúp ẩn các mã kỹ thuật (code / enums) và hiển thị nhãn thân thiện với người dùng.
 */

export const APPLICATION_STATUS = {
  NEW: { label: 'Mới nhận', badgeClass: 'soft-badge-secondary', dotColor: '#94a3b8', icon: 'bi-inbox-fill' },
  SCREENING: { label: 'Sàng lọc hồ sơ', badgeClass: 'soft-badge-info', dotColor: '#0284c7', icon: 'bi-search' },
  INTERVIEW: { label: 'Phỏng vấn', badgeClass: 'soft-badge-purple', dotColor: '#7c3aed', icon: 'bi-calendar-event-fill' },
  PASSED: { label: 'Trúng tuyển', badgeClass: 'soft-badge-success', dotColor: '#059669', icon: 'bi-check-circle-fill' },
  REJECTED: { label: 'Không đạt', badgeClass: 'soft-badge-danger', dotColor: '#dc2626', icon: 'bi-x-circle-fill' },
}

export const INTERVIEW_STATUS = {
  SCHEDULED: { label: 'Đã lên lịch', badgeClass: 'soft-badge-primary', icon: 'bi-clock-fill' },
  COMPLETED: { label: 'Đã hoàn thành', badgeClass: 'soft-badge-success', icon: 'bi-check-circle-fill' },
  CANCELLED: { label: 'Đã hủy', badgeClass: 'soft-badge-secondary', icon: 'bi-x-circle' },
}

export const JOB_STATUS = {
  OPEN: { label: 'Đang mở tuyển', badgeClass: 'soft-badge-success', icon: 'bi-check-circle-fill' },
  CLOSED: { label: 'Đã đóng tuyển', badgeClass: 'soft-badge-secondary', icon: 'bi-dash-circle' },
}

export const USER_ROLES = {
  ADMIN: 'Quản trị viên',
  HR: 'Nhân sự',
  MANAGER: 'Trưởng phòng',
}

export const CANDIDATE_SOURCES = {
  LINKEDIN: { label: 'LinkedIn', icon: 'bi-linkedin', color: '#0a66c2' },
  FACEBOOK: { label: 'Facebook', icon: 'bi-facebook', color: '#1877f2' },
  WEBSITE: { label: 'Website công ty', icon: 'bi-globe2', color: '#059669' },
  JOB_SITE: { label: 'Trang tuyển dụng', icon: 'bi-briefcase', color: '#f59e0b' },
  REFERRAL: { label: 'Giới thiệu nội bộ', icon: 'bi-people', color: '#8b5cf6' },
  OTHER: { label: 'Nguồn khác', icon: 'bi-three-dots', color: '#64748b' },
}

export const AI_TYPES = {
  CV_SUMMARY: 'Tóm tắt hồ sơ CV',
  INTERVIEW_QUESTION: 'Câu hỏi phỏng vấn gợi ý',
  EMAIL: 'Bản thảo thư tín',
}

export function formatApplicationStatus(status) {
  return APPLICATION_STATUS[status]?.label || status || 'Chưa xác định'
}

export function formatInterviewStatus(status) {
  return INTERVIEW_STATUS[status]?.label || status || 'Chưa xác định'
}

export function formatJobStatus(status) {
  return JOB_STATUS[status]?.label || status || 'Chưa xác định'
}

export function formatRole(role) {
  return USER_ROLES[role] || role || 'Người dùng'
}

export function formatSource(source) {
  return CANDIDATE_SOURCES[source]?.label || source || 'Khác'
}

export function formatAiType(type) {
  return AI_TYPES[type] || type || 'Phân tích AI'
}
