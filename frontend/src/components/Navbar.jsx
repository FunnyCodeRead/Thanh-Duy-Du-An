import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { formatRole } from '../utils/formatters'

export default function Navbar({ user }) {
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    try {
      await authApi.logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  const role = user?.role || 'HR'
  const roleBadgeClass =
    role === 'ADMIN' ? 'soft-badge-danger' : role === 'HR' ? 'soft-badge-primary' : 'soft-badge-secondary'

  const initials = (user?.full_name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="app-header">
      {/* Left: System Status Indicator */}
      <div className="d-flex align-items-center gap-2">
        <span
          className="d-inline-flex align-items-center gap-2 px-2.5 py-1 rounded-pill"
          style={{
            background: 'var(--success-soft)',
            color: 'var(--success)',
            fontSize: '0.8rem',
            fontWeight: 600,
            border: '1px solid var(--success-border)',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: 'var(--success)',
              display: 'inline-block',
              boxShadow: '0 0 0 2px rgba(22, 163, 74, 0.25)',
            }}
          />
          Hệ thống trực tuyến
        </span>
      </div>

      {/* Right: User Menu with Dropdown */}
      <div className="d-flex align-items-center gap-3">
        <div className="position-relative" ref={dropdownRef}>
          <button
            type="button"
            className="btn btn-sm p-1 border-0 bg-transparent d-flex align-items-center gap-2 text-decoration-none"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            style={{ cursor: 'pointer' }}
          >
            <div className="user-avatar-circle" style={{ width: '34px', height: '34px', fontSize: '0.8rem' }}>
              {initials}
            </div>
            <div className="d-none d-md-flex flex-column align-items-start text-start" style={{ lineHeight: 1.2 }}>
              <span className="fw-semibold text-dark small">{user?.full_name || 'Quản trị viên'}</span>
              <span className={`soft-badge ${roleBadgeClass} mt-0.5`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                {formatRole(role)}
              </span>
            </div>
            <i className={`bi bi-chevron-down text-muted small ms-1 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} style={{ fontSize: '0.75rem' }} />
          </button>

          {dropdownOpen && (
            <div
              className="position-absolute end-0 mt-2 py-1 bg-white border rounded-3 shadow-md"
              style={{
                minWidth: '200px',
                zIndex: 1050,
                borderColor: 'var(--border)',
              }}
            >
              <div className="px-3 py-2 border-bottom">
                <div className="fw-bold small text-dark">{user?.full_name}</div>
                <div className="text-muted small text-truncate" style={{ fontSize: '0.75rem' }}>
                  {user?.username || user?.email || 'Tài khoản hệ thống'}
                </div>
              </div>

              <div className="py-1">
                <div className="dropdown-item px-3 py-1.5 small text-secondary d-flex align-items-center gap-2" style={{ cursor: 'default' }}>
                  <i className="bi bi-shield-check text-muted" />
                  <span>Vai trò: <strong>{formatRole(role)}</strong></span>
                </div>
              </div>

              <div className="border-top my-1" />

              <button
                type="button"
                className="dropdown-item px-3 py-2 small text-danger d-flex align-items-center gap-2 w-100 border-0 bg-transparent text-start"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
