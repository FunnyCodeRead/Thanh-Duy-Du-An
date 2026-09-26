import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { apiRequest } from '../services/api'
import Loading from '../components/Loading'

export default function DashboardPage() {
  const { user } = useOutletContext()
  const [state, setState] = useState({ loading: true, data: null, error: '' })

  useEffect(() => {
    apiRequest('/api/dashboard')
      .then((result) => setState({ loading: false, data: result.data, error: '' }))
      .catch((error) => setState({ loading: false, data: null, error: error.message }))
  }, [])

  if (state.loading) return <Loading />

  const cards = [
    { label: 'Jobs', value: state.data?.jobs ?? 0, link: '/jobs' },
    { label: 'Candidates', value: state.data?.candidates ?? 0, link: '/candidates' },
    { label: 'Applications', value: state.data?.applications ?? 0, link: '/applications' },
    { label: 'Interviews', value: state.data?.interviews ?? 0, link: null },
  ]

  return (
    <>
      <h1 className="h3">Xin chào, {user.full_name}</h1>
      <p className="text-muted">
        Vai trò: <strong>{user.role}</strong>
      </p>
      {state.error && <div className="alert alert-danger">{state.error}</div>}

      <div className="row g-3 mt-1">
        {cards.map(({ label, value, link }) => {
          const cardContent = (
            <div className="card summary-card h-100 shadow-sm border-0">
              <div className="card-body">
                <div className="text-muted">{label}</div>
                <div className="display-6 fw-semibold">{value}</div>
              </div>
            </div>
          )

          return (
            <div className="col-sm-6 col-xl-3" key={label}>
              {link ? (
                <Link to={link} className="text-decoration-none text-reset">
                  {cardContent}
                </Link>
              ) : (
                cardContent
              )}
            </div>
          )
        })}
      </div>

      <div className="alert alert-info mt-4">
        M3 hỗ trợ quản lý vị trí, ứng viên và hồ sơ ứng tuyển. Phỏng vấn và đánh giá sẽ được triển khai ở milestone sau.
      </div>
    </>
  )
}


