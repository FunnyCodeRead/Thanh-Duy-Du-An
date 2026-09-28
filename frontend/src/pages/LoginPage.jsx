import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: 'hr@example.com', password: '123456' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  useEffect(() => {
    authApi
      .me()
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => {})
  }, [navigate])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.login(form.email, form.password)
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Email hoặc mật khẩu không chính xác.')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(email, pass) {
    setForm({ email, password: pass })
    setError('')
  }

  return (
    <div className="login-split-page">
      {/* Left Column: Brand & Hero Showcase (Desktop) */}
      <div className="login-hero-side d-none d-lg-flex">
        <div className="login-hero-glow-1" />
        <div className="login-hero-glow-2" />

        {/* Top Branding */}
        <div className="position-relative z-1">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-3 text-white shadow-sm"
              style={{
                width: '46px',
                height: '46px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                fontSize: '1.4rem',
              }}
            >
              <i className="bi bi-robot" />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold fs-5 text-white" style={{ letterSpacing: '-0.02em' }}>
                  AI Recruitment
                </span>
                <span
                  className="badge rounded-pill fw-semibold px-2 py-0.5"
                  style={{ backgroundColor: 'rgba(99, 102, 241, 0.25)', color: '#a5b4fc', fontSize: '0.72rem', border: '1px solid rgba(165, 180, 252, 0.3)' }}
                >
                  Copilot v2.0
                </span>
              </div>
              <div className="text-secondary small" style={{ color: '#94a3b8' }}>
                Hệ thống Quản lý Tuyển dụng Thông minh
              </div>
            </div>
          </div>
        </div>

        {/* Middle Value Props & Highlights */}
        <div className="position-relative z-1 my-auto py-5" style={{ maxWidth: '600px' }}>
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill mb-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <i className="bi bi-stars text-warning fs-6" />
            <span className="small fw-semibold" style={{ color: '#bfdbfe' }}>
              Trợ lý AI Gemini & RAG Vector Search
            </span>
          </div>

          <h1 className="display-6 fw-bold mb-3 text-white" style={{ letterSpacing: '-0.025em', lineHeight: 1.25 }}>
            Tuyển dụng đột phá với Trợ lý AI Copilot
          </h1>
          <p className="text-light mb-4.5" style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Nền tảng tự động hóa quản lý tuyển dụng khép kín: Tự động trích xuất CV, đối khớp kỹ năng, gợi ý câu hỏi phỏng vấn và hỗ trợ ra quyết định tuyển dụng tức thì.
          </p>

          {/* 3 Interactive Feature Tiles */}
          <div className="d-flex flex-column gap-3 mb-4">
            <div className="login-hero-feature-card d-flex align-items-start gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '38px', height: '38px', backgroundColor: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa' }}
              >
                <i className="bi bi-file-earmark-person-fill fs-5" />
              </div>
              <div>
                <h6 className="fw-bold mb-1 text-white" style={{ fontSize: '0.95rem' }}>
                  Phân tích CV & Trích xuất Kỹ năng tự động
                </h6>
                <p className="mb-0 small" style={{ color: '#94a3b8', lineHeight: 1.5 }}>
                  Chấm điểm phù hợp giữa CV và mô tả công việc (JD), tóm tắt điểm mạnh - điểm cần lưu ý trong 3 giây.
                </p>
              </div>
            </div>

            <div className="login-hero-feature-card d-flex align-items-start gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '38px', height: '38px', backgroundColor: 'rgba(124, 58, 237, 0.2)', color: '#c084fc' }}
              >
                <i className="bi bi-chat-quote-fill fs-5" />
              </div>
              <div>
                <h6 className="fw-bold mb-1 text-white" style={{ fontSize: '0.95rem' }}>
                  Hỏi đáp CV theo ngữ cảnh thực tế (RAG)
                </h6>
                <p className="mb-0 small" style={{ color: '#94a3b8', lineHeight: 1.5 }}>
                  Trò chuyện trực tiếp cùng trợ lý để đào sâu kinh nghiệm, công nghệ thực chiến của ứng viên mà không cần đọc lướt thủ công.
                </p>
              </div>
            </div>

            <div className="login-hero-feature-card d-flex align-items-start gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '38px', height: '38px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}
              >
                <i className="bi bi-calendar-check-fill fs-5" />
              </div>
              <div>
                <h6 className="fw-bold mb-1 text-white" style={{ fontSize: '0.95rem' }}>
                  Lên lịch phỏng vấn & Soạn Email tức thì
                </h6>
                <p className="mb-0 small" style={{ color: '#94a3b8', lineHeight: 1.5 }}>
                  Phân công người phỏng vấn, tạo link phòng họp và sinh trước 5 câu hỏi trọng tâm theo hồ sơ.
                </p>
              </div>
            </div>
          </div>

          {/* Metric Pill Badges */}
          <div className="d-flex align-items-center gap-3 flex-wrap pt-2">
            <div className="d-flex align-items-center gap-2 small text-light" style={{ color: '#cbd5e1' }}>
              <i className="bi bi-lightning-charge-fill text-warning" />
              <span>Tiết kiệm <strong>70%</strong> thời gian sàng lọc</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>&bull;</span>
            <div className="d-flex align-items-center gap-2 small text-light" style={{ color: '#cbd5e1' }}>
              <i className="bi bi-shield-check text-success" />
              <span>Phân quyền 3 cấp Admin / HR / Manager</span>
            </div>
          </div>
        </div>

        {/* Bottom Hero Footer */}
        <div className="position-relative z-1 pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="d-flex align-items-center justify-content-between text-secondary small" style={{ color: '#64748b' }}>
            <span>© 2026 AI Recruitment. Bảo mật dữ liệu doanh nghiệp.</span>
            <span>Hỗ trợ: Chrome, Edge, Safari</span>
          </div>
        </div>
      </div>

      {/* Right Column: Clean SaaS Login Form */}
      <div className="login-form-side">
        <div className="w-100" style={{ maxWidth: '440px' }}>
          {/* Mobile-only Branding Header */}
          <div className="d-lg-none text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-3 text-white shadow-sm mb-2"
              style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                fontSize: '1.5rem',
              }}
            >
              <i className="bi bi-robot" />
            </div>
            <h3 className="fw-bold text-dark mb-0">AI Recruitment</h3>
            <p className="text-muted small">Hệ thống Quản lý Tuyển dụng & Trợ lý Copilot</p>
          </div>

          {/* Form Header */}
          <div className="mb-4">
            <h3 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>
              Đăng nhập hệ thống
            </h3>
            <p className="text-secondary small mb-0">
              Nhập thông tin xác thực để truy cập bảng điều khiển quản lý.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2.5 py-2.5 px-3 small rounded-3 mb-3.5">
              <i className="bi bi-exclamation-triangle-fill text-danger fs-5 flex-shrink-0" />
              <div className="flex-grow-1">{error}</div>
              <button
                type="button"
                className="btn-close btn-sm"
                onClick={() => setError('')}
                aria-label="Close"
              />
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary mb-1.5" htmlFor="email">
                Địa chỉ Email <span className="text-danger">*</span>
              </label>
              <div className="input-icon-group">
                <i className="bi bi-envelope text-muted" />
                <input
                  id="email"
                  className="form-control py-2.5"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-1.5">
                <label className="form-label small fw-semibold text-secondary mb-0" htmlFor="password">
                  Mật khẩu <span className="text-danger">*</span>
                </label>
                <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
                  Mặc định: <strong className="text-dark">123456</strong>
                </span>
              </div>
              <div className="input-icon-group position-relative">
                <i className="bi bi-shield-lock text-muted" />
                <input
                  id="password"
                  className="form-control py-2.5 pe-5"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu..."
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ border: 'none', background: 'transparent' }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} fs-6`} />
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="form-check-label small text-secondary" htmlFor="rememberMe">
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
                Hệ thống nội bộ
              </span>
            </div>

            <button
              className="btn btn-primary-modern w-100 py-2.5 fs-6 fw-semibold justify-content-center d-flex align-items-center gap-2 mb-4 shadow-xs"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <i className="bi bi-box-arrow-in-right fs-5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Role Cards */}
          <div className="pt-2">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="border-bottom flex-grow-1" />
              <span className="text-muted small fw-semibold text-uppercase px-1" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                Tài khoản trải nghiệm nhanh
              </span>
              <div className="border-bottom flex-grow-1" />
            </div>

            <div className="d-flex flex-column gap-2">
              {/* HR Account */}
              <button
                type="button"
                className={`demo-role-card ${form.email === 'hr@example.com' ? 'active' : ''}`}
                onClick={() => fillDemo('hr@example.com', '123456')}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '36px', height: '36px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
                >
                  <i className="bi bi-person-badge-fill fs-6" />
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="fw-semibold text-dark small">Nhân sự (HR)</span>
                    <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
                      hr@example.com
                    </span>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Quản lý hồ sơ, lên lịch phỏng vấn & AI Copilot
                  </div>
                </div>
              </button>

              {/* Admin Account */}
              <button
                type="button"
                className={`demo-role-card ${form.email === 'admin@example.com' ? 'active' : ''}`}
                onClick={() => fillDemo('admin@example.com', '123456')}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '36px', height: '36px', backgroundColor: '#FEF2F2', color: '#DC2626' }}
                >
                  <i className="bi bi-shield-check fs-6" />
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="fw-semibold text-dark small">Quản trị viên (Admin)</span>
                    <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
                      admin@example.com
                    </span>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Toàn quyền quản trị vị trí việc làm & cấu hình hệ thống
                  </div>
                </div>
              </button>

              {/* Manager Account */}
              <button
                type="button"
                className={`demo-role-card ${form.email === 'manager@example.com' ? 'active' : ''}`}
                onClick={() => fillDemo('manager@example.com', '123456')}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '36px', height: '36px', backgroundColor: '#F0FDF4', color: '#16A34A' }}
                >
                  <i className="bi bi-briefcase-fill fs-6" />
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="fw-semibold text-dark small">Trưởng phòng (Manager)</span>
                    <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
                      manager@example.com
                    </span>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Chấm điểm phỏng vấn & phê duyệt tuyển dụng
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="text-center text-muted small mt-4 pt-2 border-top" style={{ fontSize: '0.78rem' }}>
            Hệ thống Quản lý Tuyển dụng Nội bộ &bull; Phiên bản 2026
          </div>
        </div>
      </div>
    </div>
  )
}
