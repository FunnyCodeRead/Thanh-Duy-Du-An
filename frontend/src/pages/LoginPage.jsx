import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => { authApi.me().then(() => navigate('/dashboard', { replace: true })).catch(() => {}) }, [navigate])
  async function submit(event) {
    event.preventDefault(); setError(''); setLoading(true)
    try { await authApi.login(form.email, form.password); navigate('/dashboard', { replace: true }) }
    catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }
  return <div className="login-page"><div className="card login-card shadow-sm border-0"><div className="card-body p-4 p-md-5"><h1 className="h3 text-center mb-2">Đăng nhập</h1><p className="text-muted text-center mb-4">AI Recruitment Management System</p>{error && <div className="alert alert-danger">{error}</div>}<form onSubmit={submit}><label className="form-label" htmlFor="email">Email</label><input id="email" className="form-control mb-3" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoFocus /><label className="form-label" htmlFor="password">Mật khẩu</label><input id="password" className="form-control mb-4" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><button className="btn btn-primary w-100" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button></form></div></div></div>
}

