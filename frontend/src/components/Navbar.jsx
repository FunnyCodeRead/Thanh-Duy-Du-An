import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'

export default function Navbar({ user }) {
  const navigate = useNavigate()

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  const role = user?.role || 'HR'
  const roleBadgeClass =
    role === 'ADMIN' ? 'soft-badge-danger' : role === 'HR' ? 'soft-badge-primary' : 'soft-badge-purple'

  return (
    <header className="app-header">
      <div className="d-flex align-items-center gap-2">
        <span
          className="d-inline-flex align-items-center gap-2 px-2.5 py-1 rounded-pill"
          style={{ background: '#ecfdf5', color: '#065f46', fontSize: '0.8rem', fontWeight: 600, border: '1px solid #a7f3d0' }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'inline-block',
              boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.3)',
            }}
          />
          Hệ thống trực tuyến
        </span>
      </div>

      <div className="d-flex align-items-center gap-3">
        <div className="d-none d-md-flex align-items-center gap-2">
          <span className="text-secondary small">Xin chào,</span>
          <span className="fw-semibold text-dark small">{user?.full_name}</span>
          <span className={`soft-badge ${roleBadgeClass}`}>
            {role}
          </span>
        </div>

        <button
          className="btn btn-outline-danger btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1.5"
          onClick={logout}
          title="Đăng xuất khỏi hệ thống"
        >
          <i className="bi bi-box-arrow-right"></i>
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  )
}
