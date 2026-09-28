import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import {
  aiApi,
  applicationApi,
  cvUrl,
  evaluationApi,
  interviewApi,
} from '../services/api'
import {
  formatAiType,
  formatApplicationStatus,
  formatRole,
  formatSource,
} from '../utils/formatters'
import FormattedAiContent from '../components/FormattedAiContent'

const nextStatusMap = {
  NEW: ['SCREENING', 'REJECTED'],
  SCREENING: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['PASSED', 'REJECTED'],
  PASSED: [],
  REJECTED: [],
}

const STEP_DEFINITIONS = [
  { key: 'NEW', label: 'Mới nhận', icon: 'bi-inbox-fill' },
  { key: 'SCREENING', label: 'Sàng lọc CV', icon: 'bi-file-earmark-check-fill' },
  { key: 'INTERVIEW', label: 'Phỏng vấn', icon: 'bi-calendar-check-fill' },
  { key: 'RESULT', label: 'Kết quả', icon: 'bi-trophy-fill' },
]

function stripMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove **bold**
    .replace(/\*(.*?)\*/g, '$1')     // remove *italic*
    .replace(/^#{1,6}\s+/gm, '')     // remove headings ###
    .replace(/^[-*•]\s+/gm, '• ')    // turn bullet markers into clean bullet •
    .replace(/\s+[*•-]\s+/g, ' • ')  // normalize inline bullets
    .replace(/`([^`]+)`/g, '$1')     // remove inline code
    .replace(/[*_#]/g, '')           // remove any lingering syntax symbols
    .replace(/\s+/g, ' ')            // collapse excessive whitespace
    .trim()
}

export default function ApplicationDetailPage() {
  const { user } = useOutletContext()
  const { id } = useParams()
  const canUpdate = ['ADMIN', 'HR'].includes(user?.role)

  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [interviews, setInterviews] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('')
  const [updating, setUpdating] = useState(false)
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' })

  // AI Assistant State
  const [aiResults, setAiResults] = useState([])
  const [aiLoading, setAiLoading] = useState('')
  const [aiError, setAiError] = useState('')
  const [aiCurrentResult, setAiCurrentResult] = useState(null)
  const [emailType, setEmailType] = useState('INTERVIEW_INVITATION')

  const loadDetail = useCallback(() => {
    Promise.all([
      applicationApi.get(id),
      interviewApi.list(`?application_id=${id}`),
      evaluationApi.listByApplication(id),
      aiApi.listResults(id),
    ])
      .then(([appRes, intRes, evalRes, aiRes]) => {
        setState({ loading: false, data: appRes.data, error: '' })
        const current = appRes.data?.status
        const availableNext = nextStatusMap[current] || []
        setSelectedStatus(availableNext[0] || '')
        if (['PASSED', 'REJECTED'].includes(current)) {
          setEmailType('RESULT')
        } else {
          setEmailType('INTERVIEW_INVITATION')
        }
        setInterviews(intRes.data || [])
        const results = aiRes.data || []
        setAiResults(results)
        setAiCurrentResult((prev) => prev || (results.length > 0 ? results[0] : null))
      })
      .catch((err) => {
        setState({ loading: false, data: null, error: err.message })
      })
  }, [id])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  async function handleStatusUpdate(e) {
    e.preventDefault()
    if (!selectedStatus) return

    setUpdating(true)
    setActionMessage({ text: '', type: '' })

    try {
      await applicationApi.updateStatus(id, selectedStatus)
      setActionMessage({ text: `Đã chuyển trạng thái sang "${formatApplicationStatus(selectedStatus)}" thành công.`, type: 'success' })
      loadDetail()
    } catch (err) {
      setActionMessage({ text: err.message || 'Không thể cập nhật trạng thái.', type: 'danger' })
    } finally {
      setUpdating(false)
    }
  }

  async function handleCvSummary() {
    setAiLoading('CV_SUMMARY')
    setAiError('')
    try {
      const res = await aiApi.cvSummary(id)
      setAiCurrentResult(res.data)
      const listRes = await aiApi.listResults(id)
      setAiResults(listRes.data || [])
    } catch (err) {
      setAiError(err.message || 'Không thể sử dụng trợ lý AI lúc này.')
    } finally {
      setAiLoading('')
    }
  }

  async function handleInterviewQuestions() {
    setAiLoading('INTERVIEW_QUESTION')
    setAiError('')
    try {
      const res = await aiApi.interviewQuestions(id)
      setAiCurrentResult(res.data)
      const listRes = await aiApi.listResults(id)
      setAiResults(listRes.data || [])
    } catch (err) {
      setAiError(err.message || 'Không thể sử dụng trợ lý AI lúc này.')
    } finally {
      setAiLoading('')
    }
  }

  async function handleGenerateEmail() {
    if (emailType === 'RESULT' && !['PASSED', 'REJECTED'].includes(currentStatus)) {
      setAiError('Chỉ có thể tạo email kết quả khi hồ sơ ở trạng thái Trúng tuyển hoặc Từ chối. Với hồ sơ đang xử lý, bạn có thể chọn "Mời phỏng vấn".')
      return
    }
    setAiLoading('EMAIL')
    setAiError('')
    try {
      const res = await aiApi.email(id, emailType)
      setAiCurrentResult(res.data)
      const listRes = await aiApi.listResults(id)
      setAiResults(listRes.data || [])
    } catch (err) {
      const raw = err.message || 'Không thể sử dụng trợ lý AI lúc này.'
      const clean = raw.replace(/PASSED/g, 'Trúng tuyển').replace(/REJECTED/g, 'Từ chối')
      setAiError(clean)
    } finally {
      setAiLoading('')
    }
  }

  function handleCopy(content) {
    if (!content) return
    const cleanContent = stripMarkdown(content)
    navigator.clipboard.writeText(cleanContent).then(() => {
      setActionMessage({ text: 'Đã sao chép nội dung vào khay nhớ tạm.', type: 'success' })
      setTimeout(() => setActionMessage({ text: '', type: '' }), 3000)
    })
  }

  if (state.loading) return <Loading message="Đang tải thông tin hồ sơ ứng tuyển..." />
  if (state.error) {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 my-4">
        <i className="bi bi-exclamation-triangle-fill" />
        <div>{state.error}</div>
      </div>
    )
  }

  const app = state.data || {}
  const candidate = app.candidate || {}
  const job = app.job || {}
  const currentStatus = app.status || 'NEW'
  const allowedNext = nextStatusMap[currentStatus] || []
  const isFinalState = allowedNext.length === 0

  let currentStepIdx = 0
  if (currentStatus === 'NEW') currentStepIdx = 0
  else if (currentStatus === 'SCREENING') currentStepIdx = 1
  else if (currentStatus === 'INTERVIEW') currentStepIdx = 2
  else if (currentStatus === 'PASSED' || currentStatus === 'REJECTED') currentStepIdx = 3

  return (
    <>
      <PageHeader
        title={`${candidate.full_name || 'Ứng viên'} — ${job.title || 'Vị trí'}`}
        description={`Hồ sơ ứng tuyển #${app.id} • Nộp ngày ${app.applied_at ? new Date(app.applied_at).toLocaleDateString('vi-VN') : '—'}`}
        badge={<StatusBadge status={currentStatus} />}
        action={
          <Link to="/applications" className="btn btn-secondary-modern btn-sm text-decoration-none">
            <i className="bi bi-arrow-left" />
            <span>Quay lại danh sách</span>
          </Link>
        }
      />

      {actionMessage.text && (
        <div
          className={`alert alert-${actionMessage.type} alert-dismissible fade show d-flex align-items-center gap-2 rounded-3 mb-4`}
          role="alert"
        >
          <i className={`bi ${actionMessage.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`} />
          <div className="flex-grow-1">{actionMessage.text}</div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionMessage({ text: '', type: '' })}
            aria-label="Close"
          />
        </div>
      )}

      {/* 1. Trạng thái tuyển dụng & Tiến trình (Workflow Stepper) */}
      <div className="card-modern mb-4">
        <div className="card-modern-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-diagram-3-fill text-primary" />
            <span>Tiến trình tuyển dụng hồ sơ</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Trạng thái:</span>
            <StatusBadge status={currentStatus} />
          </div>
        </div>
        <div className="card-modern-body">
          <div className="workflow-stepper">
            {STEP_DEFINITIONS.map((st, idx) => {
              let stepState = ''
              if (idx < currentStepIdx) stepState = 'completed'
              else if (idx === currentStepIdx) {
                stepState = currentStatus === 'REJECTED' ? 'rejected' : 'active'
              }

              return (
                <div key={st.key} className={`stepper-step ${stepState}`}>
                  <div className="stepper-circle">
                    {stepState === 'completed' ? (
                      <i className="bi bi-check-lg" />
                    ) : (
                      <i className={`bi ${st.icon}`} />
                    )}
                  </div>
                  <div className="stepper-label">{st.label}</div>
                </div>
              )
            })}
          </div>

          {/* Status Progression Controls */}
          {canUpdate && (
            <div className="pt-3 border-top d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mt-3">
              {isFinalState ? (
                <div className="text-secondary small d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-success" />
                  <span>
                    Hồ sơ đã đạt trạng thái cuối cùng (<strong>{formatApplicationStatus(currentStatus)}</strong>). Quy trình xét duyệt đã hoàn tất.
                  </span>
                </div>
              ) : (
                <form className="d-flex flex-wrap align-items-center gap-2" onSubmit={handleStatusUpdate}>
                  <span className="small fw-semibold text-secondary">
                    Chuyển sang bước tiếp theo:
                  </span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 'auto', minWidth: '180px', borderRadius: 'var(--radius-md)' }}
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    disabled={updating}
                  >
                    {allowedNext.map((st) => (
                      <option key={st} value={st}>
                        {formatApplicationStatus(st)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="btn btn-primary-modern btn-sm py-1.5"
                    disabled={updating || !selectedStatus}
                  >
                    {updating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" />
                        Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <span>Xác nhận chuyển</span>
                        <i className="bi bi-arrow-right" />
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="text-muted small">
                Ngày nộp:{' '}
                <strong>
                  {app.applied_at ? new Date(app.applied_at).toLocaleString('vi-VN') : '—'}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Grid: Thông tin Ứng viên & Vị trí ứng tuyển */}
      <div className="row g-4 mb-4">
        {/* Candidate Info Card */}
        <div className="col-12 col-lg-6">
          <div className="card-modern h-100">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-person-fill text-primary" />
                <span>Thông tin Ứng viên</span>
              </div>
              <Link
                to={`/candidates/${candidate.id}`}
                className="btn btn-table-action"
              >
                <i className="bi bi-eye" />
                <span>Xem chi tiết hồ sơ</span>
              </Link>
            </div>
            <div className="card-modern-body">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="table-avatar-initials"
                  style={{ width: '46px', height: '46px', fontSize: '1.1rem' }}
                >
                  {(candidate.full_name || 'U')
                    .split(' ')
                    .filter(Boolean)
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <h5 className="fw-bold mb-0 text-dark">{candidate.full_name}</h5>
                  <div className="text-muted small mt-0.5">
                    <i className="bi bi-envelope me-1" /> {candidate.email || '—'} &bull;{' '}
                    <i className="bi bi-telephone ms-1 me-1" /> {candidate.phone || '—'}
                  </div>
                </div>
              </div>

              <div className="row g-2.5 small border-top pt-3">
                <div className="col-sm-4 text-muted fw-semibold">Học vấn:</div>
                <div className="col-sm-8 text-dark">{candidate.education || '—'}</div>
                <div className="col-sm-4 text-muted fw-semibold">Kinh nghiệm:</div>
                <div className="col-sm-8 text-dark">{candidate.experience || '—'}</div>
                <div className="col-sm-4 text-muted fw-semibold">Nguồn tiếp cận:</div>
                <div className="col-sm-8">
                  <span className="soft-badge soft-badge-secondary">{formatSource(candidate.source)}</span>
                </div>
                <div className="col-sm-4 text-muted fw-semibold">Kỹ năng:</div>
                <div className="col-sm-8">
                  {candidate.skills ? (
                    <div className="d-flex flex-wrap gap-1.5">
                      {candidate.skills.split(',').map((sk, idx) => (
                        <span key={idx} className="skill-pill">
                          {sk.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    '—'
                  )}
                </div>
                <div className="col-sm-4 text-muted fw-semibold">File CV đính kèm:</div>
                <div className="col-sm-8">
                  {candidate.cv_file ? (
                    <a
                      href={cvUrl(candidate.cv_file)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-outline-danger py-1 px-2.5 small d-inline-flex align-items-center gap-1.5"
                      style={{ borderRadius: 'var(--radius-md)' }}
                    >
                      <i className="bi bi-file-earmark-pdf-fill text-danger" />
                      <span>Xem file CV đính kèm</span>
                    </a>
                  ) : (
                    <span className="text-muted">Chưa đính kèm file CV</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Info Card */}
        <div className="col-12 col-lg-6">
          <div className="card-modern h-100">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-briefcase-fill text-primary" />
                <span>Vị trí Ứng tuyển</span>
              </div>
              <Link
                to={`/jobs/${job.id}`}
                className="btn btn-table-action"
              >
                <i className="bi bi-eye" />
                <span>Xem vị trí</span>
              </Link>
            </div>
            <div className="card-modern-body">
              <div className="mb-3">
                <h5 className="fw-bold mb-1 text-dark">{job.title}</h5>
                <span className="soft-badge soft-badge-primary">
                  <i className="bi bi-building me-1" /> {job.department || 'Chung'}
                </span>
                <span className="soft-badge soft-badge-secondary ms-1">
                  Chỉ tiêu: {job.quantity || 1} người
                </span>
              </div>

              <div className="small border-top pt-3">
                <div className="mb-2">
                  <span className="text-muted fw-semibold d-block mb-1">Mô tả công việc:</span>
                  <div className="text-secondary" style={{ maxHeight: '90px', overflowY: 'auto' }}>
                    {job.description || 'Chưa cập nhật mô tả.'}
                  </div>
                </div>

                <div>
                  <span className="text-muted fw-semibold d-block mb-1">Kỹ năng yêu cầu:</span>
                  {job.skills ? (
                    <div className="d-flex flex-wrap gap-1">
                      {job.skills.split(',').map((sk, idx) => (
                        <span key={idx} className="badge bg-light text-secondary border small fw-normal">
                          {sk.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Trợ lý AI Tuyển dụng (3 Clean Blue Action Cards) */}
      <div className="card-modern mb-4">
        <div className="card-modern-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-stars text-primary" />
            <span>Trợ lý AI Tuyển dụng Thông minh</span>
          </div>
          <span className="ai-sparkle-pill">
            <i className="bi bi-cpu" />
            Gemini 2.5
          </span>
        </div>

        <div className="card-modern-body">
          <div className="row g-3 mb-3">
            {/* Action Card 1: CV Summary */}
            <div className="col-12 col-md-4">
              <button
                type="button"
                className="ai-action-btn w-100"
                onClick={handleCvSummary}
                disabled={Boolean(aiLoading)}
              >
                <div className="d-flex align-items-center justify-content-between w-100 mb-1">
                  <span className="fw-bold text-dark small d-flex align-items-center gap-2">
                    <i className="bi bi-file-text-fill text-primary" />
                    Tóm tắt năng lực CV
                  </span>
                  {aiLoading === 'CV_SUMMARY' && (
                    <span className="spinner-border spinner-border-sm text-primary" role="status" />
                  )}
                </div>
                <span className="text-muted" style={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
                  Phân tích điểm mạnh, kinh nghiệm & độ phù hợp với JD
                </span>
              </button>
            </div>

            {/* Action Card 2: Interview Questions */}
            <div className="col-12 col-md-4">
              <button
                type="button"
                className="ai-action-btn w-100"
                onClick={handleInterviewQuestions}
                disabled={Boolean(aiLoading)}
              >
                <div className="d-flex align-items-center justify-content-between w-100 mb-1">
                  <span className="fw-bold text-dark small d-flex align-items-center gap-2">
                    <i className="bi bi-patch-question-fill text-primary" />
                    Gợi ý câu hỏi phỏng vấn
                  </span>
                  {aiLoading === 'INTERVIEW_QUESTION' && (
                    <span className="spinner-border spinner-border-sm text-primary" role="status" />
                  )}
                </div>
                <span className="text-muted" style={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
                  Đề xuất 5 câu hỏi phỏng vấn có trọng tâm theo CV
                </span>
              </button>
            </div>

            {/* Action Card 3: Email Assistant */}
            <div className="col-12 col-md-4">
              <div className="ai-action-card">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-dark small d-flex align-items-center gap-2">
                    <i className="bi bi-envelope-paper-fill text-primary" />
                    Soạn email tuyển dụng
                  </span>
                  {aiLoading === 'EMAIL' && (
                    <span className="spinner-border spinner-border-sm text-primary" role="status" />
                  )}
                </div>
                <div className="d-flex gap-2 align-items-center mt-1">
                  <select
                    className="form-select form-select-sm flex-grow-1"
                    value={emailType}
                    onChange={(e) => setEmailType(e.target.value)}
                    disabled={Boolean(aiLoading)}
                    style={{ borderRadius: 'var(--radius-md)', fontSize: '0.8rem' }}
                  >
                    {['PASSED', 'REJECTED'].includes(currentStatus) ? (
                      <>
                        <option value="RESULT">Thông báo kết quả tuyển dụng</option>
                        <option value="INTERVIEW_INVITATION">Mời phỏng vấn</option>
                      </>
                    ) : (
                      <option value="INTERVIEW_INVITATION">Mời phỏng vấn</option>
                    )}
                  </select>
                  <button
                    type="button"
                    className="btn btn-primary-modern btn-sm flex-shrink-0"
                    onClick={handleGenerateEmail}
                    disabled={Boolean(aiLoading)}
                  >
                    <i className="bi bi-sparkles" />
                    <span>Tạo email</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI Loading State */}
          {aiLoading && (
            <div className="alert alert-info d-flex align-items-center gap-3 rounded-3 py-3 mb-3">
              <div className="spinner-border text-primary spinner-border-sm" role="status" />
              <div className="small">
                <strong>Trợ lý Gemini đang phân tích:</strong> Hệ thống đang đọc nội dung CV và yêu cầu vị trí để sinh dữ liệu chất lượng cao...
              </div>
            </div>
          )}

          {/* AI Error Alert */}
          {aiError && (
            <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 py-2 px-3 small mb-3">
              <i className="bi bi-exclamation-octagon-fill text-danger fs-6" />
              <div className="flex-grow-1">{aiError}</div>
              <button
                type="button"
                className="btn-close btn-sm"
                onClick={() => setAiError('')}
              />
            </div>
          )}

          {/* Live Result Display Box */}
          {aiCurrentResult && (
            <div id="ai-current-result-box" className="ai-summary-outer-box mb-4">
              <div className="card-modern-header py-3 px-3.5 bg-white border-bottom d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2.5">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-3 shadow-xs"
                    style={{ width: '36px', height: '36px', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '1.15rem' }}
                  >
                    <i className="bi bi-stars" />
                  </span>
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold text-dark fs-6">
                        Kết quả phân tích: <span className="text-primary">{formatAiType(aiCurrentResult.type)}</span>
                      </span>
                      <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                        Gemini 2.5
                      </span>
                    </div>
                    <div className="text-muted small">
                      Dữ liệu đối chiếu hồ sơ ứng viên và vị trí tuyển dụng
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 text-decoration-none d-inline-flex align-items-center gap-1"
                  onClick={() => setAiCurrentResult(null)}
                  title="Đóng kết quả này"
                >
                  <i className="bi bi-x-lg" />
                  <span>Đóng</span>
                </button>
              </div>
              <div className="p-3.5 p-md-4">
                <FormattedAiContent content={aiCurrentResult.content} type={aiCurrentResult.type} />
              </div>
            </div>
          )}

          {/* AI History List */}
          {aiResults.length > 0 && (
            <div className="border-top pt-3 mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small fw-semibold text-secondary">
                  <i className="bi bi-clock-history me-1" />
                  Lịch sử kết quả AI đã lưu ({aiResults.length} bản ghi)
                </span>
              </div>
              <div className="d-flex flex-column gap-2">
                {aiResults.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-3 bg-white border small d-flex flex-column gap-2"
                  >
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <span className="soft-badge soft-badge-primary">
                        {formatAiType(item.type)}
                      </span>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : ''}
                        </span>
                        <button
                          type="button"
                          className="btn btn-table-action"
                          onClick={() => {
                            setAiCurrentResult(item)
                            setTimeout(() => {
                              document.getElementById('ai-current-result-box')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                            }, 50)
                          }}
                        >
                          <i className="bi bi-eye" />
                          <span>Xem chi tiết</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-table-edit"
                          onClick={() => handleCopy(item.content)}
                          title="Sao chép nội dung"
                        >
                          <i className="bi bi-clipboard" />
                          <span>Sao chép</span>
                        </button>
                      </div>
                    </div>
                    <div
                      className="text-secondary"
                      style={{
                        maxHeight: '48px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.5,
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                      }}
                    >
                      {stripMarkdown(item.content)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Grid: Lịch phỏng vấn & Đánh giá hồ sơ */}
      <div className="row g-4 mb-4">
        {/* Lịch phỏng vấn */}
        <div className="col-12 col-lg-6">
          <div className="card-modern h-100">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-calendar2-week-fill text-primary" />
                <span>Lịch phỏng vấn ({interviews.length})</span>
              </div>
              {canUpdate && (
                <Link
                  to={`/interviews/create?application_id=${app.id}`}
                  className="btn btn-primary-modern btn-sm text-decoration-none"
                >
                  <i className="bi bi-plus-lg" />
                  <span>Lên lịch</span>
                </Link>
              )}
            </div>
            <div className="card-modern-body p-0">
              {interviews.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    icon="bi-calendar-x"
                    title="Chưa có lịch phỏng vấn"
                    description="Lên kế hoạch buổi gặp phỏng vấn trực tiếp hoặc trực tuyến cho hồ sơ này."
                  />
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table-modern">
                    <thead>
                      <tr>
                        <th>Người PV</th>
                        <th>Thời gian</th>
                        <th>Trạng thái</th>
                        <th style={{ width: '80px' }} className="text-end" />
                      </tr>
                    </thead>
                    <tbody>
                      {interviews.map((iv) => (
                        <tr key={iv.id}>
                          <td>
                            <div className="fw-semibold text-dark small">{iv.interviewer_name}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {iv.location || 'Chưa có địa điểm'}
                            </div>
                          </td>
                          <td>
                            <span className="small text-primary fw-medium">
                              {iv.interview_date
                                ? new Date(iv.interview_date).toLocaleString('vi-VN', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })
                                : '—'}
                            </span>
                          </td>
                          <td>
                            <StatusBadge status={iv.status} />
                          </td>
                          <td className="text-end text-nowrap">
                            <Link
                              to={`/interviews/${iv.id}`}
                              className="btn btn-table-action text-decoration-none"
                            >
                              <i className="bi bi-eye" />
                              <span>Chi tiết</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Đánh giá ứng viên */}
        <div className="col-12 col-lg-6">
          <div className="card-modern h-100">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-star-fill text-warning" />
                <span>Đánh giá ứng viên ({evaluations.length})</span>
              </div>
              <Link
                to={`/evaluations/create?application_id=${app.id}`}
                className="btn btn-primary-modern btn-sm text-decoration-none"
              >
                <i className="bi bi-plus-lg" />
                <span>Thêm đánh giá</span>
              </Link>
            </div>
            <div className="card-modern-body p-0">
              {evaluations.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    icon="bi-award"
                    title="Chưa có đánh giá nào"
                    description="Ghi nhận điểm chuyên môn, kỹ năng giao tiếp và nhận xét chi tiết sau phỏng vấn."
                  />
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table-modern">
                    <thead>
                      <tr>
                        <th>Người đánh giá</th>
                        <th>Điểm chi tiết</th>
                        <th>Điểm TB</th>
                        <th style={{ width: '80px' }} className="text-end" />
                      </tr>
                    </thead>
                    <tbody>
                      {evaluations.map((ev) => {
                        const avg = (
                          (ev.technical_score + ev.communication_score + ev.experience_score) /
                          3
                        ).toFixed(1)

                        return (
                          <tr key={ev.id}>
                            <td>
                              <div className="fw-semibold text-dark small">{ev.evaluator_name}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {ev.evaluator_role ? `${formatRole(ev.evaluator_role)} • ` : ''}
                                {ev.created_at
                                  ? new Date(ev.created_at).toLocaleDateString('vi-VN')
                                  : ''}
                              </div>
                            </td>
                            <td>
                              <div className="small text-secondary">
                                CM: <strong>{ev.technical_score}</strong> &bull; GT:{' '}
                                <strong>{ev.communication_score}</strong> &bull; KN:{' '}
                                <strong>{ev.experience_score}</strong>
                              </div>
                              {ev.comment && (
                                <div
                                  className="text-muted text-truncate small mt-0.5"
                                  style={{ maxWidth: '180px', fontSize: '0.75rem' }}
                                >
                                  "{ev.comment}"
                                </div>
                              )}
                            </td>
                            <td>
                              <span className="soft-badge soft-badge-warning fw-bold">
                                ⭐ {avg}
                              </span>
                            </td>
                            <td className="text-end text-nowrap">
                              <Link
                                to={`/evaluations/${ev.id}/edit`}
                                className="btn btn-table-action text-decoration-none"
                              >
                                <i className="bi bi-pencil" />
                                <span>Sửa</span>
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
