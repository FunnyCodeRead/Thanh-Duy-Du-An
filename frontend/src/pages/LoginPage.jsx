import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(circle at 10% 20%, #eff6ff 0%, #f8fafc 90%)',
      }}
    >
      <div
        className="card-modern shadow-lg"
        style={{
          width: '100%',
          maxWidth: '460px',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          borderRadius: '20px',
        }}
      >
        <div className="p-4 p-sm-5">
          <div className="text-center mb-4">
            <div
              className="brand-icon mx-auto mb-3"
              style={{ width: '56px', height: '56px', borderRadius: '16px', fontSize: '1.75rem' }}
            >
              <i className="bi bi-robot"></i>
            </div>
            <h2 className="fw-bold mb-1" style={{ fontSize: '1.65rem', color: '#0f172a' }}>
              AI Recruitment
            </h2>
            <p className="text-muted small mb-0">Hệ thống Quản lý Tuyển dụng & Trợ lý Copilot</p>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small rounded-3 mb-3">
              <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary" htmlFor="email">
                Địa chỉ Email
              </label>
              <div className="input-icon-group">
                <i className="bi bi-envelope"></i>
                <input
                  id="email"
                  className="form-control"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary" htmlFor="password">
                Mật khẩu
              </label>
              <div className="input-icon-group position-relative">
                <i className="bi bi-lock"></i>
                <input
                  id="password"
                  className="form-control pe-5"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
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
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary-modern w-100 py-2.5 justify-content-center mb-4"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <i className="bi bi-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="pt-3 border-top text-center">
            <span className="text-muted d-block small mb-2" style={{ fontSize: '0.785rem' }}>
              Tài khoản thử nghiệm nhanh:
            </span>
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1 small"
                onClick={() => fillDemo('hr@example.com', '123456')}
              >
                <i className="bi bi-person-badge me-1"></i> Nhân sự (HR)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-1 small"
                onClick={() => fillDemo('admin@example.com', '123456')}
              >
                <i className="bi bi-shield-lock me-1"></i> Quản trị viên
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 small"
                onClick={() => fillDemo('manager@example.com', '123456')}
              >
                <i className="bi bi-briefcase me-1"></i> Trưởng phòng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
