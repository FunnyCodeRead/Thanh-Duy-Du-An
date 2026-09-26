import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import {
  aiApi,
  applicationApi,
  cvUrl,
  evaluationApi,
  interviewApi,
} from '../services/api'

const nextStatusMap = {
  NEW: ['SCREENING', 'REJECTED'],
  SCREENING: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['PASSED', 'REJECTED'],
  PASSED: [],
  REJECTED: [],
}

const STATUS_CONFIG = {
  NEW: { label: 'Mới nhận (NEW)', badgeClass: 'soft-badge-secondary', stepIdx: 0 },
  SCREENING: { label: 'Sàng lọc (SCREENING)', badgeClass: 'soft-badge-info', stepIdx: 1 },
  INTERVIEW: { label: 'Phỏng vấn (INTERVIEW)', badgeClass: 'soft-badge-purple', stepIdx: 2 },
  PASSED: { label: 'Trúng tuyển (PASSED)', badgeClass: 'soft-badge-success', stepIdx: 3 },
  REJECTED: { label: 'Không đạt (REJECTED)', badgeClass: 'soft-badge-danger', stepIdx: 3 },
}

const STEP_DEFINITIONS = [
  { key: 'NEW', label: 'Mới nộp', icon: 'bi-inbox-fill' },
  { key: 'SCREENING', label: 'Sàng lọc CV', icon: 'bi-file-earmark-check-fill' },
  { key: 'INTERVIEW', label: 'Phỏng vấn', icon: 'bi-calendar-check-fill' },
  { key: 'RESULT', label: 'Kết quả', icon: 'bi-trophy-fill' },
]

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
  const [copied, setCopied] = useState(false)

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
        setInterviews(intRes.data || [])
        setEvaluations(evalRes.data || [])
        setAiResults(aiRes.data || [])
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
      setActionMessage({ text: `Đã chuyển trạng thái sang ${selectedStatus} thành công.`, type: 'success' })
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
    setAiLoading('EMAIL')
    setAiError('')
    try {
      const res = await aiApi.email(id, emailType)
      setAiCurrentResult(res.data)
      const listRes = await aiApi.listResults(id)
      setAiResults(listRes.data || [])
    } catch (err) {
      setAiError(err.message || 'Không thể sử dụng trợ lý AI lúc này.')
    } finally {
      setAiLoading('')
    }
  }

  function handleCopy(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (state.loading) return <Loading message="Đang tải thông tin hồ sơ ứng tuyển..." />
  if (state.error) {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 my-4">
        <i className="bi bi-exclamation-triangle-fill"></i>
        <div>{state.error}</div>
      </div>
    )
  }
  if (!state.data) {
    return (
      <div className="alert alert-warning rounded-3 my-4">
        Không tìm thấy thông tin hồ sơ ứng tuyển #{id}.
      </div>
    )
  }

  const app = state.data
  const candidate = app.candidate || {}
  const job = app.job || {}
  const currentStatus = app.status
  const allowedNext = nextStatusMap[currentStatus] || []
  const isFinalState = currentStatus === 'PASSED' || currentStatus === 'REJECTED'
  const currentStepIdx = STATUS_CONFIG[currentStatus]?.stepIdx ?? 0

  return (
    <>
      {/* Top Breadcrumb & Navigation */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Link to="/applications" className="text-secondary text-decoration-none small">
              <i className="bi bi-arrow-left me-1"></i> Hồ sơ ứng tuyển
            </Link>
            <span className="text-muted small">/</span>
            <span className="text-muted small">Hồ sơ #{app.id}</span>
          </div>
          <h1 className="h3 fw-bold mb-0 text-dark">
            Chi tiết Hồ sơ #{app.id}
          </h1>
          <p className="text-muted small mb-0 mt-0.5">
            Ứng viên: <strong className="text-dark">{candidate.full_name}</strong> &bull; Vị trí: <strong className="text-dark">{job.title}</strong>
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className={`soft-badge ${STATUS_CONFIG[currentStatus]?.badgeClass || 'soft-badge-secondary'} px-3 py-1.5 fs-6`}>
            {currentStatus}
          </span>
          <Link to="/applications" className="btn btn-secondary-modern btn-sm text-decoration-none">
            Quay lại danh sách
          </Link>
        </div>
      </div>

      {actionMessage.text && (
        <div
          className={`alert alert-${actionMessage.type} alert-dismissible fade show d-flex align-items-center gap-2 rounded-3 mb-4`}
          role="alert"
        >
          <i className={`bi ${actionMessage.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
          <div className="flex-grow-1">{actionMessage.text}</div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionMessage({ text: '', type: '' })}
            aria-label="Close"
          />
        </div>
      )}

      {/* 1. Workflow Stepper Component */}
      <div className="card-modern mb-4">
        <div className="card-modern-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-diagram-3-fill text-primary"></i>
            <span>Tiến trình tuyển dụng hồ sơ</span>
          </div>
          <span className="text-muted small">
            Trạng thái hiện tại: <strong>{currentStatus}</strong>
          </span>
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
                      <i className="bi bi-check-lg"></i>
                    ) : (
                      <i className={`bi ${st.icon}`}></i>
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
                  <i className="bi bi-check-circle text-success"></i>
                  <span>
                    Hồ sơ đã đạt trạng thái cuối cùng (<strong>{currentStatus}</strong>). Quy trình tuyển dụng đã hoàn tất.
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
                        {st} ({STATUS_CONFIG[st]?.label || st})
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
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <span>Xác nhận chuyển</span>
                        <i className="bi bi-arrow-right"></i>
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

      {/* 2. Core Grid: Candidate & Job Details */}
      <div className="row g-4 mb-4">
        {/* Candidate Info Card */}
        <div className="col-12 col-lg-6">
          <div className="card-modern h-100">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-person-badge-fill text-primary"></i>
                <span>Thông tin Ứng viên</span>
              </div>
              <Link
                to={`/candidates/${candidate.id}`}
                className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-0.5 small"
              >
                Xem chi tiết hồ sơ
              </Link>
            </div>
            <div className="card-modern-body">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="table-avatar-initials"
                  style={{ width: '48px', height: '48px', fontSize: '1.15rem' }}
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
                  <div className="text-muted small">
                    <i className="bi bi-envelope me-1"></i> {candidate.email || '—'} &bull;{' '}
                    <i className="bi bi-telephone me-1"></i> {candidate.phone || '—'}
                  </div>
                </div>
              </div>

              <div className="row g-2 small border-top pt-3">
                <div className="col-sm-4 text-muted fw-semibold">Học vấn:</div>
                <div className="col-sm-8 text-dark">{candidate.education || '—'}</div>
                <div className="col-sm-4 text-muted fw-semibold">Kinh nghiệm:</div>
                <div className="col-sm-8 text-dark">{candidate.experience || '—'}</div>
                <div className="col-sm-4 text-muted fw-semibold">Nguồn ứng viên:</div>
                <div className="col-sm-8">
                  <span className="soft-badge soft-badge-secondary">{candidate.source || 'OTHER'}</span>
                </div>
                <div className="col-sm-4 text-muted fw-semibold">Kỹ năng:</div>
                <div className="col-sm-8">
                  {candidate.skills ? (
                    <div className="d-flex flex-wrap gap-1">
                      {candidate.skills.split(',').map((sk, idx) => (
                        <span key={idx} className="badge bg-light text-dark border small fw-normal">
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
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      <a
                        href={cvUrl(candidate.cv_file)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 small d-inline-flex align-items-center gap-1.5"
                      >
                        <i className="bi bi-file-earmark-pdf-fill"></i>
                        <span>Mở xem file CV</span>
                      </a>
                    </div>
                  ) : (
                    <span className="text-muted">Chưa đính kèm file CV</span>
                  )}
                </div>

                {candidate.cv_text && (
                  <>
                    <div className="col-sm-4 text-muted fw-semibold">Nội dung CV:</div>
                    <div className="col-sm-8">
                      <div
                        className="p-2.5 rounded-3 bg-light border small text-dark"
                        style={{ maxHeight: '140px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}
                      >
                        {candidate.cv_text}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Job Info Card */}
        <div className="col-12 col-lg-6">
          <div className="card-modern h-100">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-briefcase-fill text-indigo" style={{ color: '#4f46e5' }}></i>
                <span>Vị trí Ứng tuyển</span>
              </div>
              <Link
                to={`/jobs/${job.id}`}
                className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-0.5 small"
              >
                Xem vị trí
              </Link>
            </div>
            <div className="card-modern-body">
              <div className="mb-3">
                <h5 className="fw-bold mb-1 text-dark">{job.title}</h5>
                <span className="soft-badge soft-badge-primary">
                  <i className="bi bi-building me-1"></i> {job.department || 'Chung'}
                </span>
                <span className="soft-badge soft-badge-secondary ms-1">
                  Chỉ tiêu: {job.quantity || 1} người
                </span>
              </div>

              <div className="small border-top pt-3">
                <div className="mb-2">
                  <div className="fw-semibold text-muted mb-0.5">Mô tả công việc:</div>
                  <div className="text-dark text-preline">{job.description || 'Chưa cập nhật'}</div>
                </div>
                <div>
                  <div className="fw-semibold text-muted mb-0.5">Yêu cầu tuyển dụng:</div>
                  <div className="text-dark text-preline">{job.requirements || 'Chưa cập nhật'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CENTERPIECE: Google Gemini AI Copilot Hub */}
      <div className="ai-copilot-card p-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
          <div className="d-flex align-items-center gap-2.5">
            <div className="brand-icon" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-stars"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h4 className="fw-bold mb-0 text-dark">Trợ lý AI Gemini (Copilot Hub)</h4>
                <span className="ai-sparkle-pill">
                  <i className="bi bi-lightning-charge-fill"></i> AI Advisory
                </span>
              </div>
              <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                Hỗ trợ phân tích ứng viên và soạn thảo nội dung tuyển dụng tự động.
              </small>
            </div>
          </div>

          <div className="small text-secondary px-2.5 py-1 rounded-pill bg-white border d-inline-flex align-items-center gap-1.5">
            <i className="bi bi-shield-check text-success"></i>
            <span>Quyền quyết định thuộc về nhà tuyển dụng</span>
          </div>
        </div>

        {/* AI Action Buttons */}
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-4">
            <button
              className="ai-action-btn w-100"
              onClick={handleCvSummary}
              disabled={Boolean(aiLoading)}
            >
              <div className="d-flex align-items-center justify-content-between w-100">
                <span className="fw-bold text-dark small">
                  <i className="bi bi-file-text-fill text-primary me-1.5"></i>
                  Tóm tắt năng lực CV
                </span>
                {aiLoading === 'CV_SUMMARY' && (
                  <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                )}
              </div>
              <span className="text-muted" style={{ fontSize: '0.785rem' }}>
                Phân tích điểm mạnh, kinh nghiệm & độ phù hợp với JD
              </span>
            </button>
          </div>

          <div className="col-12 col-md-4">
            <button
              className="ai-action-btn w-100"
              onClick={handleInterviewQuestions}
              disabled={Boolean(aiLoading)}
            >
              <div className="d-flex align-items-center justify-content-between w-100">
                <span className="fw-bold text-dark small">
                  <i className="bi bi-patch-question-fill text-indigo me-1.5" style={{ color: '#6366f1' }}></i>
                  Gợi ý câu hỏi phỏng vấn
                </span>
                {aiLoading === 'INTERVIEW_QUESTION' && (
                  <span className="spinner-border spinner-border-sm text-indigo" role="status"></span>
                )}
              </div>
              <span className="text-muted" style={{ fontSize: '0.785rem' }}>
                Đề xuất 5 câu hỏi phỏng vấn có trọng tâm theo CV
              </span>
            </button>
          </div>

          <div className="col-12 col-md-4">
            <div className="d-flex gap-1.5">
              <select
                className="form-select form-select-sm"
                value={emailType}
                onChange={(e) => setEmailType(e.target.value)}
                disabled={Boolean(aiLoading)}
                style={{ width: '130px', borderRadius: 'var(--radius-md)', fontSize: '0.785rem' }}
              >
                <option value="INTERVIEW_INVITATION">Mời phỏng vấn</option>
                <option value="RESULT">Thông báo kết quả</option>
              </select>
              <button
                className="ai-action-btn flex-grow-1"
                onClick={handleGenerateEmail}
                disabled={Boolean(aiLoading)}
              >
                <div className="d-flex align-items-center justify-content-between w-100">
                  <span className="fw-bold text-dark small">
                    <i className="bi bi-envelope-paper-fill text-success me-1.5"></i>
                    Soạn email
                  </span>
                  {aiLoading === 'EMAIL' && (
                    <span className="spinner-border spinner-border-sm text-success" role="status"></span>
                  )}
                </div>
                <span className="text-muted" style={{ fontSize: '0.785rem' }}>
                  Sinh bản thảo thư tín
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* AI Loading State */}
        {aiLoading && (
          <div className="alert alert-info d-flex align-items-center gap-3 rounded-3 py-3 mb-3">
            <div className="spinner-border text-primary spinner-border-sm" role="status"></div>
            <div className="small">
              <strong>Trợ lý Gemini đang phân tích:</strong> Hệ thống đang đọc nội dung CV và yêu cầu vị trí để sinh dữ liệu chất lượng cao...
            </div>
          </div>
        )}

        {/* AI Error Alert */}
        {aiError && (
          <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 py-2 px-3 small mb-3">
            <i className="bi bi-exclamation-octagon-fill text-danger fs-6"></i>
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
          <div className="card-modern shadow-sm border-0 mb-3" style={{ borderLeft: '4px solid #6366f1' }}>
            <div className="card-modern-header py-2.5 bg-white">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-stars text-primary"></i>
                <span className="fw-bold text-dark small">
                  Kết quả phân tích vừa tạo ({aiCurrentResult.type})
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-0.5 small d-inline-flex align-items-center gap-1"
                  onClick={() => handleCopy(aiCurrentResult.content)}
                >
                  <i className={`bi ${copied ? 'bi-check-lg text-success' : 'bi-clipboard'}`}></i>
                  <span>{copied ? 'Đã sao chép!' : 'Sao chép'}</span>
                </button>
                <button
                  className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                  onClick={() => setAiCurrentResult(null)}
                  title="Đóng kết quả này"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
            <div className="card-modern-body pt-2">
              <div className="ai-result-box">{aiCurrentResult.content}</div>
            </div>
          </div>
        )}

        {/* AI History Collapsible / List */}
        {aiResults.length > 0 && (
          <div className="border-top pt-3 mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small fw-semibold text-secondary">
                <i className="bi bi-clock-history me-1"></i>
                Lịch sử kết quả AI đã lưu ({aiResults.length} bản ghi)
              </span>
            </div>
            <div className="d-flex flex-column gap-2">
              {aiResults.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-3 bg-white border small d-flex flex-column gap-1"
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="soft-badge soft-badge-primary">
                      {item.type}
                    </span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : ''}
                      </span>
                      <button
                        className="btn btn-sm btn-outline-secondary py-0 px-2 rounded-pill"
                        style={{ fontSize: '0.7rem' }}
                        onClick={() => handleCopy(item.content)}
                      >
                        Sao chép
                      </button>
                    </div>
                  </div>
                  <div
                    className="text-secondary text-truncate"
                    style={{ maxHeight: '48px', whiteSpace: 'pre-line' }}
                  >
                    {item.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Lower Grid: Interviews & Evaluations */}
      <div className="row g-4 mb-4">
        {/* Interviews List in Application */}
        <div className="col-12 col-lg-6">
          <div className="card-modern h-100">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-calendar2-week-fill text-primary"></i>
                <span>Lịch phỏng vấn ({interviews.length})</span>
              </div>
              {canUpdate && (
                <Link
                  to={`/interviews/create?application_id=${app.id}`}
                  className="btn btn-sm btn-primary-modern py-1 px-2.5 text-decoration-none"
                >
                  <i className="bi bi-plus-lg"></i>
                  <span>Lên lịch</span>
                </Link>
              )}
            </div>
            <div className="card-modern-body p-0">
              {interviews.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  <i className="bi bi-calendar-x d-block fs-3 text-secondary mb-1"></i>
                  Chưa có lịch phỏng vấn nào cho hồ sơ này.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table-modern">
                    <thead>
                      <tr>
                        <th>Người PV</th>
                        <th>Thời gian</th>
                        <th>Trạng thái</th>
                        <th style={{ width: '80px' }}></th>
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
                            <span
                              className={`soft-badge ${
                                iv.status === 'COMPLETED'
                                  ? 'soft-badge-success'
                                  : iv.status === 'SCHEDULED'
                                  ? 'soft-badge-primary'
                                  : 'soft-badge-secondary'
                              }`}
                            >
                              {iv.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <Link
                              to={`/interviews/${iv.id}`}
                              className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-0.5 small"
                            >
                              Chi tiết
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

        {/* Evaluations List in Application */}
        <div className="col-12 col-lg-6">
          <div className="card-modern h-100">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-star-fill text-warning"></i>
                <span>Đánh giá ứng viên ({evaluations.length})</span>
              </div>
              <Link
                to={`/evaluations/create?application_id=${app.id}`}
                className="btn btn-sm btn-primary-modern py-1 px-2.5 text-decoration-none"
              >
                <i className="bi bi-plus-lg"></i>
                <span>Thêm đánh giá</span>
              </Link>
            </div>
            <div className="card-modern-body p-0">
              {evaluations.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  <i className="bi bi-award d-block fs-3 text-secondary mb-1"></i>
                  Chưa có đánh giá nào cho ứng viên này.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table-modern">
                    <thead>
                      <tr>
                        <th>Người đánh giá</th>
                        <th>Điểm chi tiết</th>
                        <th>Điểm TB</th>
                        <th style={{ width: '80px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluations.map((ev) => {
                        const avg = (
                          (ev.technical_score + ev.communication_score + ev.experience_score) /
                          3
                        ).toFixed(2)

                        return (
                          <tr key={ev.id}>
                            <td>
                              <div className="fw-semibold text-dark small">{ev.evaluator_name}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {ev.created_at
                                  ? new Date(ev.created_at).toLocaleDateString('vi-VN')
                                  : ''}
                              </div>
                            </td>
                            <td>
                              <div className="small text-secondary">
                                Chuyên môn: <strong>{ev.technical_score}</strong> &bull; Giao tiếp:{' '}
                                <strong>{ev.communication_score}</strong> &bull; Kinh nghiệm:{' '}
                                <strong>{ev.experience_score}</strong>
                              </div>
                              {ev.comment && (
                                <div
                                  className="text-muted text-truncate small mt-0.5"
                                  style={{ maxWidth: '200px', fontSize: '0.75rem' }}
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
                            <td className="text-end">
                              <Link
                                to={`/evaluations/${ev.id}/edit`}
                                className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-0.5 small"
                              >
                                Sửa
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
