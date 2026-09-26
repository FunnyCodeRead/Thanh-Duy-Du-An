import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { apiRequest } from '../services/api'
import Loading from '../components/Loading'

export default function DashboardPage() {
  const { user } = useOutletContext()
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  useEffect(() => { apiRequest('/api/dashboard').then((result) => setState({ loading: false, data: result.data, error: '' })).catch((error) => setState({ loading: false, data: null, error: error.message })) }, [])
  if (state.loading) return <Loading />
  const cards = [['Jobs', state.data?.jobs ?? 0], ['Candidates', state.data?.candidates ?? 0], ['Applications', state.data?.applications ?? 0], ['Interviews', state.data?.interviews ?? 0]]
  return <><h1 className="h3">Xin chào, {user.full_name}</h1><p className="text-muted">Vai trò: <strong>{user.role}</strong></p>{state.error && <div className="alert alert-danger">{state.error}</div>}<div className="row g-3 mt-1">{cards.map(([label, value]) => <div className="col-sm-6 col-xl-3" key={label}><div className="card summary-card h-100 shadow-sm border-0"><div className="card-body"><div className="text-muted">{label}</div><div className="display-6 fw-semibold">{value}</div></div></div></div>)}</div><div className="alert alert-info mt-4">M2 hỗ trợ quản lý vị trí, ứng viên và CV. Application và Interview sẽ được triển khai ở milestone sau.</div></>
}

