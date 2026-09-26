import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Loading from '../components/Loading'
import { applicationApi, interviewApi } from '../services/api'

function toDateTimeLocal(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const min = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

export default function InterviewFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const prefillApplicationId = searchParams.get('application_id') || ''

  const [form, setForm] = useState({
    application_id: prefillApplicationId,
    interviewer_id: '',
    interview_date: '',
    location: '',
    note: '',
  })

  const [interviewers, setInterviewers] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      interviewApi.interviewers(),
      applicationApi.list(),
      isEdit ? interviewApi.get(id) : Promise.resolve(null),
    ])
      .then(([intRes, appRes, interviewRes]) => {
        setInterviewers(intRes.data || [])
        setApplications(appRes.data || [])

        if (interviewRes?.data) {
          const item = interviewRes.data
          if (item.status !== 'SCHEDULED') {
            setError(`Chỉ có thể chỉnh sửa phỏng vấn ở trạng thái SCHEDULED (Hiện tại: ${item.status}).`)
          }
          setForm({
            application_id: String(item.application_id || ''),
            interviewer_id: String(item.interviewer_id || ''),
            interview_date: toDateTimeLocal(item.interview_date),
            location: item.location || '',
            note: item.note || '',
          })
        }
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Lỗi khi tải dữ liệu.')
        setLoading(false)
      })
  }, [id, isEdit])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.application_id) {
      setError('Vui lòng chọn hồ sơ ứng tuyển.')
      return
    }
    if (!form.interviewer_id) {
      setError('Vui lòng chọn người phỏng vấn.')
      return
    }
    if (!form.interview_date) {
      setError('Vui lòng chọn thời gian phỏng vấn.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const payload = {
        application_id: Number(form.application_id),
        interviewer_id: Number(form.interviewer_id),
        interview_date: form.interview_date,
        location: form.location,
        note: form.note,
      }

      if (isEdit) {
        await interviewApi.update(id, payload)
        navigate(`/interviews/${id}`)
      } else {
        const res = await interviewApi.create(payload)
        navigate(`/interviews/${res.id || ''}`)
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu lịch phỏng vấn.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">{isEdit ? `Sửa lịch phỏng vấn #${id}` : 'Lên lịch phỏng vấn mới'}</h1>
        <Link className="btn btn-outline-secondary" to={isEdit ? `/interviews/${id}` : '/interviews'}>
          Hủy
        </Link>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Hồ sơ ứng tuyển <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={form.application_id}
                  disabled={isEdit || Boolean(prefillApplicationId)}
                  onChange={(e) => setForm({ ...form, application_id: e.target.value })}
                  required
                >
                  <option value="">-- Chọn hồ sơ ứng tuyển --</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      #{app.id} - {app.candidate_name || `Ứng viên #${app.candidate_id}`} | {app.job_title || `Vị trí #${app.job_id}`} ({app.status})
                    </option>
                  ))}
                </select>
                <div className="form-text">
                  Chỉ nên lên lịch phỏng vấn cho hồ sơ đang trong giai đoạn phỏng vấn.
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Người phỏng vấn <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={form.interviewer_id}
                  onChange={(e) => setForm({ ...form, interviewer_id: e.target.value })}
                  required
                >
                  <option value="">-- Chọn người phỏng vấn --</option>
                  {interviewers.map((usr) => (
                    <option key={usr.id} value={usr.id}>
                      {usr.full_name} ({usr.role} - {usr.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Thời gian phỏng vấn <span className="text-danger">*</span>
                </label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={form.interview_date}
                  onChange={(e) => setForm({ ...form, interview_date: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Địa điểm / Hình thức</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Phòng họp 302, hoặc link Google Meet / Teams"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Ghi chú</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Nội dung cần tập trung trao đổi, chuẩn bị kỹ thuật..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>

              <div className="col-12 d-flex justify-content-end gap-2 pt-2">
                <Link className="btn btn-secondary" to={isEdit ? `/interviews/${id}` : '/interviews'}>
                  Hủy bỏ
                </Link>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : isEdit ? 'Lưu cập nhật' : 'Xác nhận lên lịch'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
