import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Loading from '../components/Loading'
import PageHeader from '../components/PageHeader'
import { applicationApi, interviewApi } from '../services/api'
import { formatApplicationStatus, formatInterviewStatus, formatRole } from '../utils/formatters'

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
            setError(`Chỉ có thể chỉnh sửa buổi phỏng vấn khi đang ở trạng thái Đã lên lịch (Hiện tại: ${formatInterviewStatus(item.status)}).`)
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

  if (loading) return <Loading message="Đang tải dữ liệu lịch phỏng vấn..." />

  return (
    <div className="form-page mx-auto" style={{ maxWidth: '850px' }}>
      <PageHeader
        title={isEdit ? `Chỉnh sửa Lịch phỏng vấn #${id}` : 'Lên lịch Phỏng vấn Mới'}
        description="Chọn thời gian, phân công người phỏng vấn và địa điểm / link họp cho ứng viên."
        action={
          <Link
            to={isEdit ? `/interviews/${id}` : '/interviews'}
            className="btn btn-secondary-modern btn-sm text-decoration-none"
          >
            <i className="bi bi-arrow-left" />
            <span>Quay lại</span>
          </Link>
        }
      />

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-3">
          <i className="bi bi-exclamation-circle-fill" />
          <div>{error}</div>
        </div>
      )}

      <div className="card-modern">
        <div className="card-modern-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-calendar-event text-primary" />
            <span>Thông tin buổi phỏng vấn</span>
          </div>
          <span className="text-muted small">* Trường bắt buộc</span>
        </div>
        <div className="card-modern-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label small fw-semibold text-secondary">
                  Chọn hồ sơ ứng tuyển <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={form.application_id}
                  onChange={(e) => setForm({ ...form, application_id: e.target.value })}
                  disabled={isEdit}
                  required
                >
                  <option value="">-- Chọn hồ sơ ứng tuyển --</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      #{app.id} - {app.candidate_name} ({app.job_title}) [{formatApplicationStatus(app.status)}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">
                  Người phỏng vấn phụ trách <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={form.interviewer_id}
                  onChange={(e) => setForm({ ...form, interviewer_id: e.target.value })}
                  required
                >
                  <option value="">-- Phân công người phỏng vấn --</option>
                  {interviewers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email}) - {formatRole(u.role)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">
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

              <div className="col-12">
                <label className="form-label small fw-semibold text-secondary">
                  Địa điểm hoặc Link phòng họp online (Google Meet, Zoom, MS Teams...)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Phòng họp 302, Tòa nhà A hoặc https://meet.google.com/xyz-abcd-efg"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold text-secondary">
                  Ghi chú nội bộ cho buổi phỏng vấn
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Nội dung cần tập trung đánh giá, tài liệu đính kèm..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  style={{ height: 'auto' }}
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-4">
              <Link
                to={isEdit ? `/interviews/${id}` : '/interviews'}
                className="btn btn-secondary-modern"
              >
                Hủy bỏ
              </Link>
              <button
                type="submit"
                className="btn btn-primary-modern"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg" />
                    <span>{isEdit ? 'Cập nhật lịch' : 'Lưu lịch phỏng vấn'}</span>
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
