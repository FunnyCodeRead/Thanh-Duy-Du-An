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
        {/* Left Column: Comprehensive Single Unified Form Card */}
        <div className="col-12 col-lg-8">
          <div className="card-modern shadow-xs">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <span
                  className="d-inline-flex align-items-center justify-content-center rounded-2"
                  style={{ width: '28px', height: '28px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
                >
                  <i className="bi bi-calendar-plus-fill" />
                </span>
                <span className="fw-bold">Thông tin chi tiết buổi phỏng vấn</span>
              </div>
              <span className="text-danger small fw-semibold">* Trường bắt buộc</span>
            </div>

            <div className="card-modern-body p-4">
              <form onSubmit={handleSubmit}>
                {/* Section 1: Ứng viên & Hồ sơ */}
                <div className="mb-4">
                  <div className="d-flex align-items-center gap-2 mb-2.5">
                    <i className="bi bi-person-badge text-primary" />
                    <h6 className="fw-bold mb-0 text-dark">Ứng viên & Hồ sơ ứng tuyển</h6>
                  </div>

                  {selectedApp && !showAppPicker ? (
                    <div className="candidate-prefill-card">
                      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="table-avatar-initials flex-shrink-0"
                            style={{
                              width: '50px',
                              height: '50px',
                              fontSize: '1.15rem',
                              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                              color: '#ffffff',
                              boxShadow: '0 3px 8px rgba(37, 99, 235, 0.25)',
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
                        <option value="">-- Chọn hồ sơ ứng tuyển từ danh sách --</option>
                        {applications.map((app) => (
                          <option key={app.id} value={app.id}>
                            #{app.id} - {app.candidate_name} ({app.job_title}) [{formatApplicationStatus(app.status)}]
                          </option>
                        ))}
                      </select>
                      {selectedApp && (
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-muted p-0 mt-1.5 text-decoration-none small"
                          onClick={() => setShowAppPicker(false)}
                        >
                          Quay lại thẻ ứng viên đã chọn
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <hr className="my-4 text-secondary-subtle" />

                {/* Section 2: Người phỏng vấn & Thời gian */}
                <div className="mb-4">
                  <div className="d-flex align-items-center gap-2 mb-2.5">
                    <i className="bi bi-calendar2-check text-warning" />
                    <h6 className="fw-bold mb-0 text-dark">Thời gian & Phân công người phỏng vấn</h6>
                  </div>

                  <div className="row g-3">
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

                <hr className="my-4 text-secondary-subtle" />

                {/* Section 3: Địa điểm & Hình thức họp */}
                <div className="mb-4">
                  <div className="d-flex align-items-center gap-2 mb-2.5">
                    <i className="bi bi-geo-alt text-success" />
                    <h6 className="fw-bold mb-0 text-dark">Địa điểm & Hình thức phỏng vấn</h6>
                  </div>

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
                      Chọn nhanh mẫu hình thức / phòng họp:
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

                <hr className="my-4 text-secondary-subtle" />

                {/* Section 4: Ghi chú nội bộ */}
                <div className="mb-4">
                  <div className="d-flex align-items-center gap-2 mb-2.5">
                    <i className="bi bi-journal-text text-purple" />
                    <h6 className="fw-bold mb-0 text-dark">Ghi chú & Trọng tâm đánh giá</h6>
                  </div>

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

                {/* Bottom Action Bar */}
                <div className="d-flex align-items-center justify-content-between pt-3 border-top mt-4">
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
          </div>
        </div>

        {/* Right Column: Unified Clean Summary Card */}
        <div className="col-12 col-lg-4">
          <div className="card-modern shadow-xs mb-4">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <span
                  className="d-inline-flex align-items-center justify-content-center rounded-2"
                  style={{ width: '28px', height: '28px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
                >
                  <i className="bi bi-calendar2-check-fill" />
                </span>
                <span className="fw-bold">Tóm tắt lịch phỏng vấn</span>
              </div>
              <span
                className="badge rounded-pill fw-semibold px-2.5 py-1"
                style={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.72rem' }}
              >
                Bản nháp
              </span>
            </div>

            <div className="card-modern-body p-3.5">
              {/* Date & Time Highlight Box */}
              <div
                className="p-3 rounded-3 mb-3"
                style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
              >
                <div className="d-flex align-items-center gap-1.5 text-primary small fw-semibold mb-1">
                  <i className="bi bi-clock-fill" />
                  <span>Thời gian dự kiến:</span>
                </div>
                {datePreview ? (
                  <div className="fw-bold text-dark fs-6" style={{ letterSpacing: '-0.01em' }}>
                    {datePreview.fullDateStr}
                  </div>
                ) : (
                  <div className="text-muted small fst-italic">
                    Chưa chọn ngày và giờ (vui lòng chọn ở biểu mẫu)
                  </div>
                )}
              </div>

              {/* Candidate Info Tile */}
              <div className="p-2.5 rounded-3 mb-2.5 bg-white border">
                <div className="text-muted small fw-medium mb-1 d-flex align-items-center gap-1.5">
                  <i className="bi bi-person-fill text-primary" />
                  <span>Ứng viên phỏng vấn:</span>
                </div>
                <div className="fw-bold text-dark" style={{ fontSize: '0.94rem' }}>
                  {selectedApp?.candidate_name || 'Chưa chọn ứng viên'}
                </div>
                {selectedApp && (
                  <div className="text-secondary small mt-0.5">
                    Vị trí: <strong className="text-primary">{selectedApp.job_title}</strong>
                  </div>
                )}
              </div>

              {/* Interviewer Tile */}
              <div className="p-2.5 rounded-3 mb-2.5 bg-white border">
                <div className="text-muted small fw-medium mb-1 d-flex align-items-center gap-1.5">
                  <i className="bi bi-person-check-fill text-success" />
                  <span>Người phỏng vấn phụ trách:</span>
                </div>
                <div className="fw-semibold text-dark" style={{ fontSize: '0.92rem' }}>
                  {selectedInterviewer ? selectedInterviewer.full_name : 'Chưa phân công'}
                </div>
                {selectedInterviewer && (
                  <div className="mt-1">
                    <span
                      className="badge rounded-pill bg-light text-secondary border fw-medium px-2 py-0.5"
                      style={{ fontSize: '0.72rem' }}
                    >
                      {formatRole(selectedInterviewer.role)}
                    </span>
                  </div>
                )}
              </div>

              {/* Location Tile */}
              <div className="p-2.5 rounded-3 mb-3 bg-white border">
                <div className="text-muted small fw-medium mb-1 d-flex align-items-center gap-1.5">
                  <i className="bi bi-geo-alt-fill text-danger" />
                  <span>Địa điểm / Link họp:</span>
                </div>
                <div className="text-dark small text-break fw-medium" style={{ lineHeight: 1.5 }}>
                  {form.location ? (
                    form.location.startsWith('http') ? (
                      <a href={form.location} target="_blank" rel="noreferrer" className="text-primary text-decoration-none">
                        <i className="bi bi-box-arrow-up-right me-1" />
                        {form.location}
                      </a>
                    ) : (
                      form.location
                    )
                  ) : (
                    <span className="text-muted fst-italic">Chưa nhập địa điểm hoặc link</span>
                  )}
                </div>
              </div>

              {/* Next Steps Workflow */}
              <div className="pt-2 border-top">
                <div className="fw-bold text-dark small mb-2 d-flex align-items-center gap-1.5">
                  <i className="bi bi-diagram-3-fill text-primary" />
                  <span>Quy trình sau khi lưu lịch:</span>
                </div>
                <div className="d-flex flex-column gap-2 small">
                  <div className="d-flex align-items-start gap-2 text-secondary">
                    <i className="bi bi-check-circle-fill text-primary mt-0.5 flex-shrink-0" style={{ fontSize: '0.85rem' }} />
                    <span>Hồ sơ tự động chuyển sang trạng thái <strong>Phỏng vấn</strong>.</span>
                  </div>
                  <div className="d-flex align-items-start gap-2 text-secondary">
                    <i className="bi bi-check-circle-fill text-primary mt-0.5 flex-shrink-0" style={{ fontSize: '0.85rem' }} />
                    <span>Dùng AI soạn email mời có sẵn link và ngày giờ.</span>
                  </div>
                  <div className="d-flex align-items-start gap-2 text-secondary">
                    <i className="bi bi-check-circle-fill text-primary mt-0.5 flex-shrink-0" style={{ fontSize: '0.85rem' }} />
                    <span>Ghi nhận đánh giá & chấm điểm sau buổi phỏng vấn.</span>
                  </div>
                </div>
              </div>

              {/* AI Assistant Tip Callout */}
              <div
                className="p-2.5 rounded-3 mt-3 d-flex align-items-start gap-2"
                style={{ backgroundColor: '#FAF5FF', border: '1px solid #EDE9FE' }}
              >
                <i className="bi bi-stars mt-0.5 flex-shrink-0" style={{ color: '#7C3AED' }} />
                <div className="small text-secondary" style={{ lineHeight: 1.5, fontSize: '0.8rem' }}>
                  <strong className="d-block text-dark" style={{ color: '#5B21B6' }}>Mẹo chuẩn bị phỏng vấn</strong>
                  Sau khi lưu, bạn có thể tạo trước 5 câu hỏi trọng tâm theo CV bằng AI tại chi tiết hồ sơ.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
