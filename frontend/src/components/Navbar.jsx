import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'

export default function Navbar({ user }) {
  const navigate = useNavigate()
  async function logout() { try { await authApi.logout() } finally { navigate('/login', { replace: true }) } }
  return <nav className="navbar navbar-dark bg-primary px-3 px-lg-4"><span className="navbar-brand fw-semibold">AI Recruitment</span><div className="d-flex align-items-center gap-3 text-white"><span className="d-none d-md-inline">{user.full_name} ({user.role})</span><button className="btn btn-outline-light btn-sm" onClick={logout}>Đăng xuất</button></div></nav>
}

