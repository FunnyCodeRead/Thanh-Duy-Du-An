import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import Loading from '../components/Loading'
import { applicationApi, candidateApi, jobApi } from '../services/api'

export default function ApplicationCreatePage() {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const canCreate = ['ADMIN', 'HR'].includes(user.role)

  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [form, setForm] = useState({ candidateId: '', jobId: '', note: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([candidateApi.list(), jobApi.list()])
      .then(([candidatesRes, jobsRes]) => {
        setCandidates(candidatesRes.data || [])
        setJobs(jobsRes.data || [])
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message || 'Không thể tải dữ liệu ban đầu.')
        setLoading(false)
      })
  }, [])

  if (!canCreate) {
    return (
      <div className="alert alert-danger">
        Bạn không có quyền tạo hồ sơ ứng tuyển. Chỉ ADMIN và HR mới được thực hiện thao tác này.
      </div>
    )
  }

  if (loading) return <Loading />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.candidateId) {
      setError('Vui lòng chọn ứng viên.')
      return
    }
    if (!form.jobId) {
      setError('Vui lòng chọn vị trí tuyển dụng.')
      return
    }

    setSubmitting(true)
    try {
      const res = await applicationApi.create({
        candidate_id: Number(form.candidateId),
        job_id: Number(form.jobId),
        note: form.note.trim(),
      })
      const newId = res.data?.id
      if (newId) {
        navigate(`/applications/${newId}`)
      } else {
        navigate('/applications')
      }
    } catch (err) {
      if (err.status === 409 || err.message?.includes('đã có hồ sơ')) {
        setError('Ứng viên đã có hồ sơ ứng tuyển cho vị trí này.')
      } else {
        setError(err.message || 'Không thể tạo hồ sơ ứng tuyển.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-1">Tạo hồ sơ ứng tuyển</h1>
          <p className="text-muted mb-0">Liên kết ứng viên vào một vị trí tuyển dụng.</p>
        </div>
        <Link className="btn btn-outline-secondary" to="/applications">
          Quay lại danh sách
        </Link>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Ứng viên <span className="text-danger">*</span></label>
              <select
                className="form-select"
                value={form.candidateId}
                onChange={(e) => setForm({ ...form, candidateId: e.target.value })}
                required
              >
                <option value="">-- Chọn ứng viên --</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} — {c.email || 'Chưa có email'}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Vị trí tuyển dụng <span className="text-danger">*</span></label>
              <select
                className="form-select"
                value={form.jobId}
                onChange={(e) => setForm({ ...form, jobId: e.target.value })}
                required
              >
                <option value="">-- Chọn vị trí --</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} — {j.department} ({j.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Ghi chú ban đầu</label>
              <textarea
                className="form-control"
                rows="3"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Nhập ghi chú (nguồn giới thiệu, lý do ứng tuyển...)"
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <Link className="btn btn-outline-secondary" to="/applications">
                Hủy bỏ
              </Link>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Tạo hồ sơ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
