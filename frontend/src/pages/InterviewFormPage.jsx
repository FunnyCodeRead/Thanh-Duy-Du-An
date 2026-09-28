import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Loading from '../components/Loading'
import StatusBadge from '../components/StatusBadge'
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

function getPresetDate(daysAhead, hour, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  d.setHours(hour, minute, 0, 0)
  return toDateTimeLocal(d)
}

function formatDisplayDate(dateString) {
  if (!dateString) return null
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return null

  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  const dayName = days[d.getDay()]
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return {
    day,
    month: `THÁNG ${d.getMonth() + 1}`,
    timeStr: `${hours}:${minutes}`,
    fullDateStr: `${hours}:${minutes} • ${dayName}, ${day}/${month}/${year}`,
  }
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
  const [showAppPicker, setShowAppPicker] = useState(false)

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

  // Current selected application object
  const selectedApp = useMemo(() => {
    if (!form.application_id) return null
    return applications.find((a) => String(a.id) === String(form.application_id)) || null
  }, [applications, form.application_id])

  // Current selected interviewer object
  const selectedInterviewer = useMemo(() => {
    if (!form.interviewer_id) return null
    return interviewers.find((u) => String(u.id) === String(form.interviewer_id)) || null
  }, [interviewers, form.interviewer_id])

  const datePreview = useMemo(() => {
    return formatDisplayDate(form.interview_date)
  }, [form.interview_date])

  const candidateInitials = useMemo(() => {
    const name = selectedApp?.candidate_name || 'U'
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }, [selectedApp])

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

  const backLink = form.application_id
    ? `/applications/${form.application_id}`
    : isEdit
      ? `/interviews/${id}`
      : '/interviews'

  if (loading) return <Loading message="Đang tải dữ liệu chuẩn bị lịch phỏng vấn..." />

  return (
    <div className="interview-form-wrapper pb-5">
      {/* Top Breadcrumb & Action Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <Link to="/interviews" className="text-decoration-none text-muted">
                  <i className="bi bi-calendar2-week me-1" />
                  Lịch phỏng vấn
                </Link>
              </li>
              <li className="breadcrumb-item active fw-semibold text-dark" aria-current="page">
                {isEdit ? `Chỉnh sửa #${id}` : 'Lên lịch phỏng vấn mới'}
              </li>
            </ol>
          </nav>
          <h4 className="fw-bold text-dark mb-0">
            {isEdit ? `Chỉnh sửa Lịch phỏng vấn #${id}` : 'Lên lịch Phỏng vấn Mới'}
          </h4>
        </div>

        <Link to={backLink} className="btn btn-secondary-modern btn-sm text-decoration-none">
          <i className="bi bi-arrow-left me-1" />
          <span>Quay lại</span>
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-4">
          <i className="bi bi-exclamation-triangle-fill fs-5" />
          <div className="flex-grow-1">{error}</div>
          <button
            type="button"
            className="btn-close btn-sm"
            onClick={() => setError('')}
          />
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="row g-4">
        {/* Left Column: Input Form */}
        <div className="col-12 col-lg-8">
          <form onSubmit={handleSubmit}>
            {/* Card 1: Ứng viên & Hồ sơ ứng tuyển */}
            <div className="card-modern mb-4">
              <div className="card-modern-header">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-2"
                    style={{ width: '28px', height: '28px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
                  >
                    <i className="bi bi-person-badge-fill" />
                  </span>
                  <span className="fw-bold">Ứng viên & Hồ sơ ứng tuyển</span>
                </div>
                <span className="text-danger small fw-semibold">* Bắt buộc</span>
              </div>

              <div className="card-modern-body">
                {selectedApp && !showAppPicker ? (
                  <div className="candidate-prefill-card">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="table-avatar-initials flex-shrink-0"
                          style={{
                            width: '48px',
                            height: '48px',
                            fontSize: '1.1rem',
                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            color: '#ffffff',
                            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                          }}
                        >
                          {candidateInitials}
                        </div>
                        <div>
                          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                            <span className="fw-bold text-dark fs-6">
                              {selectedApp.candidate_name || 'Ứng viên'}
                            </span>
                            <span className="badge rounded-pill bg-white text-primary border border-primary-subtle fw-semibold px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                              Hồ sơ #{selectedApp.id}
                            </span>
                            <StatusBadge status={selectedApp.status} />
                          </div>
                          <div className="text-secondary small d-flex align-items-center gap-2 flex-wrap">
                            <span>
                              <i className="bi bi-briefcase me-1 text-primary" />
                              {selectedApp.job_title || 'Chưa rõ vị trí'}
                            </span>
                            {selectedApp.candidate_email && (
                              <span>&bull; <i className="bi bi-envelope me-1" />{selectedApp.candidate_email}</span>
                            )}
                            {selectedApp.candidate_phone && (
                              <span>&bull; <i className="bi bi-telephone me-1" />{selectedApp.candidate_phone}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {!isEdit && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 flex-shrink-0 text-decoration-none"
                          onClick={() => setShowAppPicker(true)}
                        >
                          <i className="bi bi-arrow-repeat me-1" />
                          <span>Đổi hồ sơ</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="form-label small fw-semibold text-secondary">
                      Chọn hồ sơ ứng tuyển từ danh sách <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={form.application_id}
                      onChange={(e) => {
                        setForm({ ...form, application_id: e.target.value })
                        setShowAppPicker(false)
                      }}
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
                    {selectedApp && (
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-muted p-0 mt-2 text-decoration-none small"
                        onClick={() => setShowAppPicker(false)}
                      >
                        Quay lại thẻ ứng viên đã chọn
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Thời gian & Phân công người phỏng vấn */}
            <div className="card-modern mb-4">
              <div className="card-modern-header">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-2"
                    style={{ width: '28px', height: '28px', backgroundColor: '#FEF3C7', color: '#D97706' }}
                  >
                    <i className="bi bi-calendar2-check-fill" />
                  </span>
                  <span className="fw-bold">Thời gian & Phân công phỏng vấn</span>
                </div>
              </div>

              <div className="card-modern-body">
                <div className="row g-3">
                  {/* Người phỏng vấn phụ trách */}
                  <div className="col-12 col-md-6">
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
                    {selectedInterviewer && (
                      <div className="d-flex align-items-center gap-2 mt-1.5 small text-muted">
                        <i className="bi bi-shield-check text-success" />
                        <span>Vai trò: <strong className="text-dark">{formatRole(selectedInterviewer.role)}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Thời gian phỏng vấn */}
                  <div className="col-12 col-md-6">
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

                  {/* Quick Datetime Preset Chips */}
                  <div className="col-12 pt-1">
                    <div className="text-muted small mb-1.5">
                      <i className="bi bi-lightning-charge me-1 text-warning" />
                      Gợi ý chọn nhanh thời gian:
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="preset-chip"
                        onClick={() => setForm({ ...form, interview_date: getPresetDate(0, 14, 0) })}
                      >
                        <i className="bi bi-clock" />
                        Hôm nay 14:00
                      </button>
                      <button
                        type="button"
                        className="preset-chip"
                        onClick={() => setForm({ ...form, interview_date: getPresetDate(1, 9, 0) })}
                      >
                        <i className="bi bi-sun" />
                        Ngày mai 09:00
                      </button>
                      <button
                        type="button"
                        className="preset-chip"
                        onClick={() => setForm({ ...form, interview_date: getPresetDate(1, 14, 0) })}
                      >
                        <i className="bi bi-clock-history" />
                        Ngày mai 14:00
                      </button>
                      <button
                        type="button"
                        className="preset-chip"
                        onClick={() => setForm({ ...form, interview_date: getPresetDate(2, 10, 0) })}
                      >
                        <i className="bi bi-calendar-plus" />
                        Ngày kia 10:00
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Địa điểm & Hình thức phỏng vấn */}
            <div className="card-modern mb-4">
              <div className="card-modern-header">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-2"
                    style={{ width: '28px', height: '28px', backgroundColor: '#ECFDF5', color: '#059669' }}
                  >
                    <i className="bi bi-geo-alt-fill" />
                  </span>
                  <span className="fw-bold">Địa điểm & Hình thức phỏng vấn</span>
                </div>
              </div>

              <div className="card-modern-body">
                <div className="mb-2">
                  <label className="form-label small fw-semibold text-secondary">
                    Địa điểm hoặc Link phòng họp online (Google Meet, Zoom, MS Teams...)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <i className="bi bi-link-45deg fs-6" />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: https://meet.google.com/xyz-abcd-efg hoặc Phòng họp 302, Tòa nhà A"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                  </div>
                </div>

                {/* Quick Location Presets */}
                <div className="mt-2.5">
                  <div className="text-muted small mb-1.5">
                    <i className="bi bi-pin-map me-1 text-success" />
                    Chọn nhanh mẫu địa điểm / hình thức:
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="preset-chip"
                      onClick={() => setForm({ ...form, location: 'https://meet.google.com/ (Tạo link Google Meet)' })}
                    >
                      <i className="bi bi-camera-video text-primary" />
                      Google Meet
                    </button>
                    <button
                      type="button"
                      className="preset-chip"
                      onClick={() => setForm({ ...form, location: 'https://zoom.us/j/ (Tạo link Zoom Meeting)' })}
                    >
                      <i className="bi bi-camera-video-fill text-info" />
                      Zoom Meeting
                    </button>
                    <button
                      type="button"
                      className="preset-chip"
                      onClick={() => setForm({ ...form, location: 'Phòng họp 101 - Trụ sở chính (Tầng 1)' })}
                    >
                      <i className="bi bi-building text-secondary" />
                      Phòng họp 101 (Tòa nhà A)
                    </button>
                    <button
                      type="button"
                      className="preset-chip"
                      onClick={() => setForm({ ...form, location: 'Phòng họp 202 - Khu vực phỏng vấn (Tầng 2)' })}
                    >
                      <i className="bi bi-door-open text-secondary" />
                      Phòng họp 202 (Tầng 2)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Ghi chú & Trọng tâm buổi phỏng vấn */}
            <div className="card-modern mb-4">
              <div className="card-modern-header">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-2"
                    style={{ width: '28px', height: '28px', backgroundColor: '#EDE9FE', color: '#7C3AED' }}
                  >
                    <i className="bi bi-journal-text" />
                  </span>
                  <span className="fw-bold">Ghi chú & Trọng tâm đánh giá</span>
                </div>
              </div>

              <div className="card-modern-body">
                <div className="mb-2">
                  <label className="form-label small fw-semibold text-secondary">
                    Ghi chú nội bộ cho buổi phỏng vấn
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Ghi chú nội bộ cho hội đồng phỏng vấn: Trọng tâm đánh giá, bài test kỹ năng, tài liệu tham khảo..."
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    style={{ height: 'auto', lineHeight: '1.6' }}
                  />
                </div>

                {/* Quick Note Presets */}
                <div className="mt-2.5">
                  <div className="text-muted small mb-1.5">Mẫu ghi chú nhanh:</div>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="preset-chip"
                      onClick={() =>
                        setForm({
                          ...form,
                          note: 'Phỏng vấn chuyên môn kỹ thuật: Đánh giá kiến thức nền tảng, kinh nghiệm thực chiến và giải quyết bài toán thực tế.',
                        })
                      }
                    >
                      + Chuyên môn kỹ thuật
                    </button>
                    <button
                      type="button"
                      className="preset-chip"
                      onClick={() =>
                        setForm({
                          ...form,
                          note: 'Phỏng vấn văn hóa & Kỹ năng mềm: Đánh giá mức độ phù hợp văn hóa doanh nghiệp, khả năng giao tiếp và làm việc nhóm.',
                        })
                      }
                    >
                      + Văn hóa & Kỹ năng mềm
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-white border shadow-xs">
              <Link to={backLink} className="btn btn-secondary-modern">
                Hủy bỏ
              </Link>
              <button
                type="submit"
                className="btn btn-primary-modern px-4 py-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1.5" role="status" />
                    Đang lưu lịch...
                  </>
                ) : (
                  <>
                    <i className="bi bi-calendar2-check-fill me-1.5" />
                    <span>{isEdit ? 'Cập nhật lịch phỏng vấn' : 'Xác nhận & Lưu lịch phỏng vấn'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Schedule Preview & Next Steps */}
        <div className="col-12 col-lg-4">
          {/* Card: Live Schedule Preview */}
          <div className="interview-preview-card mb-4">
            <div className="interview-preview-header">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="badge rounded-pill bg-white text-primary fw-bold px-2.5 py-1" style={{ fontSize: '0.72rem' }}>
                  XEM TRƯỚC LỊCH
                </span>
                <span className="badge rounded-pill bg-success text-white fw-semibold px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                  Đã lên lịch
                </span>
              </div>
              <h6 className="fw-bold mb-0 text-white" style={{ letterSpacing: '-0.01em' }}>
                Phiếu Lịch hẹn Phỏng vấn
              </h6>
            </div>

            <div className="p-3.5">
              {/* Date & Time display */}
              <div className="interview-date-display mb-3">
                <div className="interview-calendar-badge">
                  <div className="interview-calendar-month">
                    {datePreview?.month || 'THỜI GIAN'}
                  </div>
                  <div className="interview-calendar-day">
                    {datePreview?.day || '—'}
                  </div>
                </div>
                <div>
                  <div className="fw-bold text-dark" style={{ fontSize: '0.94rem' }}>
                    {datePreview ? datePreview.fullDateStr : 'Chưa chọn thời gian'}
                  </div>
                  <div className="text-muted small">
                    {datePreview ? 'Thời gian phỏng vấn dự kiến' : 'Vui lòng chọn ngày và giờ'}
                  </div>
                </div>
              </div>

              {/* Summary Details List */}
              <div className="d-flex flex-column gap-2.5 small pt-1">
                {/* Candidate */}
                <div className="d-flex justify-content-between align-items-start border-bottom pb-2">
                  <span className="text-secondary">Ứng viên:</span>
                  <span className="fw-bold text-dark text-end">
                    {selectedApp?.candidate_name || 'Chưa chọn'}
                  </span>
                </div>

                {/* Job Position */}
                <div className="d-flex justify-content-between align-items-start border-bottom pb-2">
                  <span className="text-secondary">Vị trí:</span>
                  <span className="fw-semibold text-primary text-end">
                    {selectedApp?.job_title || 'Chưa chọn'}
                  </span>
                </div>

                {/* Interviewer */}
                <div className="d-flex justify-content-between align-items-start border-bottom pb-2">
                  <span className="text-secondary">Phụ trách:</span>
                  <span className="fw-semibold text-dark text-end">
                    {selectedInterviewer ? (
                      <>
                        {selectedInterviewer.full_name}
                        <span className="d-block text-muted" style={{ fontSize: '0.75rem' }}>
                          {formatRole(selectedInterviewer.role)}
                        </span>
                      </>
                    ) : (
                      'Chưa phân công'
                    )}
                  </span>
                </div>

                {/* Location */}
                <div className="d-flex justify-content-between align-items-start">
                  <span className="text-secondary">Địa điểm / Link:</span>
                  <span className="text-dark text-end text-break" style={{ maxWidth: '170px' }}>
                    {form.location || 'Chưa nhập địa điểm'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Next Steps Workflow */}
          <div className="card-modern mb-4">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-diagram-3-fill text-primary" />
                <span className="fw-bold">Quy trình sau khi lên lịch</span>
              </div>
            </div>
            <div className="card-modern-body">
              <div className="d-flex flex-column gap-3 small">
                <div className="d-flex align-items-start gap-2.5">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold"
                    style={{ width: '22px', height: '22px', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '0.75rem' }}
                  >
                    1
                  </span>
                  <div>
                    <strong className="text-dark d-block">Lưu lịch vào hệ thống</strong>
                    <span className="text-muted">Hồ sơ ứng tuyển tự động chuyển sang giai đoạn Phỏng vấn.</span>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2.5">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold"
                    style={{ width: '22px', height: '22px', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '0.75rem' }}
                  >
                    2
                  </span>
                  <div>
                    <strong className="text-dark d-block">Gửi email mời phỏng vấn</strong>
                    <span className="text-muted">Dùng trợ lý Gemini AI để soạn sẵn thư mời với đầy đủ link và ngày giờ.</span>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2.5">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold"
                    style={{ width: '22px', height: '22px', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '0.75rem' }}
                  >
                    3
                  </span>
                  <div>
                    <strong className="text-dark d-block">Ghi nhận đánh giá năng lực</strong>
                    <span className="text-muted">Chấm điểm chuyên môn, kỹ năng giao tiếp sau khi phỏng vấn xong.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: AI Assistant Tip */}
          <div className="candidate-ai-card p-3.5">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-2"
                style={{ width: '28px', height: '28px', backgroundColor: '#EDE9FE', color: '#7C3AED' }}
              >
                <i className="bi bi-stars" />
              </span>
              <span className="fw-bold text-dark" style={{ color: '#5B21B6' }}>
                Mẹo chuẩn bị phỏng vấn
              </span>
            </div>
            <p className="text-secondary small mb-0" style={{ lineHeight: 1.55 }}>
              Bạn có thể sử dụng chức năng <strong>Gợi ý câu hỏi phỏng vấn</strong> của Trợ lý AI tại trang chi tiết hồ sơ để chuẩn bị 5 câu hỏi trọng tâm nhất theo đúng CV ứng viên.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
