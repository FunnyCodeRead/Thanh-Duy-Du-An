import { NavLink } from 'react-router-dom'
import { formatRole } from '../utils/formatters'

export default function Sidebar({ user }) {
  const role = user?.role || 'HR'
  const roleBadgeClass =
    role === 'ADMIN' ? 'soft-badge-danger' : role === 'HR' ? 'soft-badge-primary' : 'soft-badge-purple'

  const initials = (user?.full_name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside className="app-sidebar">
      <div>
        <div className="sidebar-header">
          <NavLink to="/dashboard" className="brand-logo">
            <div className="brand-icon">
              <i className="bi bi-robot"></i>
            </div>
            <div>
              <div style={{ lineHeight: 1.15 }}>AI Recruitment</div>
              <small style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                Tuyển dụng Thông minh
              </small>
            </div>
          </NavLink>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Tổng quan</div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-grid-1x2-fill"></i>
            <span>Bảng điều khiển</span>
          </NavLink>

          <div className="nav-section-title mt-2">Quy trình tuyển dụng</div>
          <NavLink
            to="/jobs"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-briefcase-fill"></i>
            <span>Vị trí tuyển dụng</span>
          </NavLink>

          <NavLink
            to="/candidates"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-people-fill"></i>
            <span>Hồ sơ ứng viên</span>
          </NavLink>

          <NavLink
            to="/applications"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-file-earmark-person-fill"></i>
            <span>Hồ sơ ứng tuyển</span>
          </NavLink>

          <NavLink
            to="/interviews"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-calendar2-week-fill"></i>
            <span>Lịch phỏng vấn</span>
          </NavLink>

          <div className="nav-section-title mt-2">Trợ lý thông minh</div>
          <NavLink
            to="/ai-chat"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-robot text-primary"></i>
            <span>✨ Trợ lý AI</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-avatar-circle">{initials}</div>
          <div className="flex-grow-1 min-w-0">
            <div className="fw-semibold text-truncate small" style={{ maxWidth: '140px' }}>
              {user?.full_name || 'Người dùng'}
            </div>
            <span className={`soft-badge ${roleBadgeClass}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
              {formatRole(role)}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

