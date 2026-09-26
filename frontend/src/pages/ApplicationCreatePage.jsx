import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import Loading from '../components/Loading'
import { applicationApi, candidateApi, jobApi } from '../services/api'

export default function ApplicationCreatePage() {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const canCreate = ['ADMIN', 'HR'].includes(user?.role)

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
      <div className="alert alert-danger rounded-3 my-4">
        Bạn không có quyền tạo hồ sơ ứng tuyển. Chỉ ADMIN và HR mới được thực hiện thao tác này.
      </div>
    )
  }

  if (loading) return <Loading message="Đang tải danh sách ứng viên và vị trí..." />

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
        setError('Ứng viên này đã có hồ sơ ứng tuyển cho vị trí này (chống trùng lặp).')
      } else {
        setError(err.message || 'Không thể tạo hồ sơ ứng tuyển.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="form-page mx-auto" style={{ maxWidth: '800px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">Tạo Hồ sơ Ứng tuyển Mới</h1>
          <p className="text-muted mb-0 small">
            Gán một ứng viên trong kho hồ sơ vào vị trí tuyển dụng tương ứng.
          </p>
        </div>
        <Link to="/applications" className="btn btn-secondary-modern btn-sm text-decoration-none">
          <i className="bi bi-arrow-left"></i>
          <span>Quay lại</span>
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-3">
          <i className="bi bi-exclamation-circle-fill"></i>
          <div>{error}</div>
        </div>
      )}

      <div className="card-modern">
        <div className="card-modern-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-file-earmark-person-fill text-primary"></i>
            <span>Thiết lập hồ sơ</span>
          </div>
          <span className="text-muted small">* Trường bắt buộc</span>
        </div>
        <div className="card-modern-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">
                Chọn ứng viên <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                value={form.candidateId}
                onChange={(e) => setForm({ ...form, candidateId: e.target.value })}
                required
              >
                <option value="">-- Chọn ứng viên trong danh sách --</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} — {c.full_name} ({c.email || 'Chưa có email'})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">
                Vị trí tuyển dụng <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                value={form.jobId}
                onChange={(e) => setForm({ ...form, jobId: e.target.value })}
                required
              >
                <option value="">-- Chọn vị trí cần ứng tuyển --</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    #{j.id} — {j.title} [{j.department || 'Chung'}] ({j.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">Ghi chú ban đầu</label>
              <textarea
                className="form-control"
                rows="3"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Nhập ghi chú thêm về nguồn giới thiệu, mức lương kỳ vọng..."
              />
            </div>

            <div className="d-flex justify-content-end gap-2 border-top pt-3">
              <Link to="/applications" className="btn btn-secondary-modern">
                Hủy bỏ
              </Link>
              <button
                type="submit"
                className="btn btn-primary-modern"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Đang tạo hồ sơ...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg"></i>
                    <span>Tạo hồ sơ ứng tuyển</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
