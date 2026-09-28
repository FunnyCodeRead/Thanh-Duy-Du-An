import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import { candidateApi, cvUrl } from '../services/api'

const SOURCES = [
  { value: 'LINKEDIN', label: 'LinkedIn', icon: 'bi-linkedin', colorClass: 'source-badge-linkedin', desc: 'Mạng xã hội nghề nghiệp LinkedIn' },
  { value: 'FACEBOOK', label: 'Facebook', icon: 'bi-facebook', colorClass: 'source-badge-facebook', desc: 'Kênh tuyển dụng Facebook' },
  { value: 'WEBSITE', label: 'Website công ty', icon: 'bi-globe2', colorClass: 'source-badge-website', desc: 'Cổng thông tin tuyển dụng trực tiếp' },
  { value: 'JOB_SITE', label: 'Trang tuyển dụng', icon: 'bi-briefcase-fill', colorClass: 'source-badge-jobsite', desc: 'Các trang việc làm (TopCV, VietnamWorks...)' },
  { value: 'REFERRAL', label: 'Giới thiệu nội bộ', icon: 'bi-people-fill', colorClass: 'source-badge-referral', desc: 'Nhân sự hoặc nhân viên nội bộ giới thiệu' },
  { value: 'OTHER', label: 'Nguồn khác', icon: 'bi-three-dots', colorClass: 'source-badge-default', desc: 'Kênh tiếp nhận ứng viên khác' },
]

function getFileIcon(fileName) {
  if (!fileName) return 'bi-file-earmark'
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.pdf')) return 'bi-file-earmark-pdf-fill text-danger'
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'bi-file-earmark-word-fill text-primary'
  return 'bi-file-earmark-text-fill text-secondary'
}

export default function CandidateDetailPage() {
  const { user } = useOutletContext()
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    candidateApi
      .get(id)
      .then((r) => setState({ loading: false, data: r.data, error: '' }))
      .catch((e) => setState({ loading: false, data: null, error: e.message }))
  }, [id])

  function handleCopyCvText(text) {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (state.loading) return <Loading message="Đang tải thông tin chi tiết ứng viên..." />
  if (state.error) {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 my-4">
        <i className="bi bi-exclamation-triangle-fill" />
        <div>{state.error}</div>
      </div>
    )
  }

  const c = state.data
  const canEdit = ['ADMIN', 'HR'].includes(user?.role)
  const initials = (c.full_name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const sourceItem = SOURCES.find((s) => s.value === c.source) || {
    value: c.source || 'OTHER',
    label: c.source || 'Chưa rõ nguồn',
    icon: 'bi-tag-fill',
    colorClass: 'source-badge-default',
    desc: 'Kênh tiếp nhận ứng viên',
  }

  const skillList = c.skills ? c.skills.split(',').map((s) => s.trim()).filter(Boolean) : []
  const formattedDate = c.created_at ? new Date(c.created_at).toLocaleDateString('vi-VN') : '—'
  const formattedTime = c.created_at ? new Date(c.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <div className="candidate-detail-wrapper pb-5">
      {/* Top Breadcrumb & Quick Actions Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link to="/candidates" className="text-decoration-none text-muted">
                <i className="bi bi-people me-1" />
                Ứng viên
              </Link>
            </li>
            <li className="breadcrumb-item active fw-semibold text-dark" aria-current="page">
              Chi tiết #{c.id}
            </li>
          </ol>
        </nav>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Link to="/candidates" className="btn btn-secondary-modern btn-sm text-decoration-none">
            <i className="bi bi-arrow-left me-1" />
            <span>Danh sách</span>
          </Link>
          {canEdit && (
            <>
              <Link
                to={`/candidates/${id}/edit`}
                className="btn btn-secondary-modern btn-sm text-decoration-none"
              >
                <i className="bi bi-pencil me-1" />
                <span>Chỉnh sửa</span>
              </Link>
              <Link
                to={`/applications/create?candidate_id=${c.id}`}
                className="btn btn-primary-modern btn-sm text-decoration-none"
              >
                <i className="bi bi-plus-lg me-1" />
                <span>Tạo đơn ứng tuyển</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Hero Candidate Profile Card */}
      <div className="candidate-hero-card mb-4">
        <div className="candidate-hero-banner" />
        <div className="px-4 pb-4">
          <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-3">
            <div className="d-flex align-items-end gap-3.5">
              <div className="candidate-hero-avatar">
                {initials}
              </div>
              <div className="pt-2">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                  <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.02em' }}>
                    {c.full_name}
                  </h3>
                  <span
                    className="badge rounded-pill fw-semibold"
                    style={{
                      backgroundColor: '#EFF6FF',
                      color: '#2563EB',
                      border: '1px solid #BFDBFE',
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.6rem',
                    }}
                  >
                    ID #{c.id}
                  </span>
                  <span className={`source-badge ${sourceItem.colorClass}`}>
                    <i className={`bi ${sourceItem.icon}`} />
                    <span>{sourceItem.label}</span>
                  </span>
                </div>
                <div className="text-muted small">
                  Hồ sơ ứng viên trong hệ thống quản lý tuyển dụng
                </div>
              </div>
            </div>

            {/* Quick Status / Quick Metrics */}
            <div className="d-flex align-items-center gap-2 pt-2 pt-md-0">
              {c.cv_file ? (
                <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2 fw-semibold">
                  <i className="bi bi-file-earmark-check-fill me-1" />
                  Đã tải tệp CV
                </span>
              ) : (
                <span className="badge rounded-pill bg-light text-secondary border px-3 py-2 fw-semibold">
                  <i className="bi bi-file-earmark-x me-1" />
                  Chưa có tệp CV
                </span>
              )}
            </div>
          </div>

          {/* Contact Chips Row */}
          <div className="d-flex flex-wrap align-items-center gap-2.5 mt-3 pt-3 border-top">
            <a
              href={`mailto:${c.email || ''}`}
              className="candidate-meta-chip"
              title="Gửi email cho ứng viên"
            >
              <i className="bi bi-envelope-fill text-primary" />
              <span>{c.email || 'Chưa cập nhật email'}</span>
            </a>

            <a
              href={`tel:${c.phone || ''}`}
              className="candidate-meta-chip"
              title="Gọi điện cho ứng viên"
            >
              <i className="bi bi-telephone-fill text-success" />
              <span>{c.phone || 'Chưa cập nhật số điện thoại'}</span>
            </a>

            <div className="candidate-meta-chip">
              <i className="bi bi-calendar3 text-muted" />
              <span>Ngày thêm: {formattedDate} {formattedTime && `• ${formattedTime}`}</span>
            </div>

            {skillList.length > 0 && (
              <div className="candidate-meta-chip">
                <i className="bi bi-stars text-warning" />
                <span>{skillList.length} Kỹ năng chuyên môn</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="row g-4">
        {/* Left Column: Education, Experience, Skills, CV File & Text */}
        <div className="col-12 col-lg-8">
          {/* Card 1: Experience & Education */}
          <div className="card-modern mb-4">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <span
                  className="d-inline-flex align-items-center justify-content-center rounded-2"
                  style={{ width: '28px', height: '28px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
                >
                  <i className="bi bi-briefcase-fill" />
                </span>
                <span className="fw-bold">Kinh nghiệm làm việc & Học vấn</span>
              </div>
            </div>

            <div className="card-modern-body">
              {/* Experience Section */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <h6 className="fw-bold text-dark mb-0">Kinh nghiệm làm việc</h6>
                </div>
                {c.experience ? (
                  <div
                    className="p-3 rounded-3"
                    style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', whiteSpace: 'pre-line', lineHeight: '1.65', color: '#1E293B' }}
                  >
                    {c.experience}
                  </div>
                ) : (
                  <div className="text-muted small fst-italic p-3 rounded-3 bg-light border">
                    Chưa cập nhật thông tin kinh nghiệm làm việc.
                  </div>
                )}
              </div>

              {/* Education Section */}
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <h6 className="fw-bold text-dark mb-0">Trình độ học vấn & Bằng cấp</h6>
                </div>
                {c.education ? (
                  <div
                    className="p-3 rounded-3"
                    style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', whiteSpace: 'pre-line', lineHeight: '1.65', color: '#1E293B' }}
                  >
                    {c.education}
                  </div>
                ) : (
                  <div className="text-muted small fst-italic p-3 rounded-3 bg-light border">
                    Chưa cập nhật thông tin trình độ học vấn.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Professional Skills */}
          <div className="card-modern mb-4">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <span
                  className="d-inline-flex align-items-center justify-content-center rounded-2"
                  style={{ width: '28px', height: '28px', backgroundColor: '#FEF3C7', color: '#D97706' }}
                >
                  <i className="bi bi-lightning-charge-fill" />
                </span>
                <span className="fw-bold">Kỹ năng chuyên môn</span>
              </div>
              <span className="badge rounded-pill bg-light text-secondary border fw-semibold">
                {skillList.length} kỹ năng
              </span>
            </div>

            <div className="card-modern-body">
              {skillList.length > 0 ? (
                <div className="d-flex flex-wrap gap-2">
                  {skillList.map((skill, idx) => (
                    <span key={idx} className="skill-pill">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-muted small fst-italic">
                  Chưa có thông tin kỹ năng chuyên môn được gắn thẻ.
                </div>
              )}
            </div>
          </div>

          {/* Card 3: CV File & Extracted Text */}
          <div className="card-modern mb-4">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <span
                  className="d-inline-flex align-items-center justify-content-center rounded-2"
                  style={{ width: '28px', height: '28px', backgroundColor: '#FEE2E2', color: '#DC2626' }}
                >
                  <i className="bi bi-file-earmark-person-fill" />
                </span>
                <span className="fw-bold">Hồ sơ CV & Nội dung số hóa</span>
              </div>
            </div>

            <div className="card-modern-body">
              {/* CV File Attachment Download Section */}
              <div className="mb-4">
                <div className="text-secondary small fw-semibold mb-2">Tệp tài liệu đính kèm:</div>
                {c.cv_file ? (
                  <div
                    className="p-3 rounded-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3"
                    style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <span
                        className="d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                        style={{ width: '42px', height: '42px', backgroundColor: '#FEE2E2', fontSize: '1.25rem' }}
                      >
                        <i className={getFileIcon(c.cv_file)} />
                      </span>
                      <div>
                        <div className="fw-semibold text-dark text-break" style={{ fontSize: '0.92rem' }}>
                          {c.cv_file}
                        </div>
                        <div className="text-muted small">Tệp CV gốc đã được lưu trữ an toàn</div>
                      </div>
                    </div>

                    <a
                      href={cvUrl(c.cv_file)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-cv-pill flex-shrink-0"
                      title="Tải / Xem tệp CV"
                    >
                      <i className="bi bi-download" />
                      <span>Tải / Xem tệp CV</span>
                    </a>
                  </div>
                ) : (
                  <div className="p-3 rounded-3 bg-light border text-muted small fst-italic">
                    <i className="bi bi-info-circle me-1" />
                    Chưa có tệp CV đính kèm cho ứng viên này.
                  </div>
                )}
              </div>

              {/* Extracted CV Text Section */}
              {c.cv_text ? (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="text-secondary small fw-semibold">
                      <i className="bi bi-file-text me-1 text-primary" />
                      Văn bản trích xuất từ CV:
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm py-1 px-2.5 small"
                      onClick={() => handleCopyCvText(c.cv_text)}
                      title="Sao chép toàn bộ văn bản CV"
                    >
                      <i className={`bi ${copied ? 'bi-check-lg text-success' : 'bi-clipboard'} me-1`} />
                      <span>{copied ? 'Đã sao chép!' : 'Sao chép'}</span>
                    </button>
                  </div>
                  <div className="candidate-cv-text-box">
                    {c.cv_text}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right Column: Meta Information, Applications, AI Assistant */}
        <div className="col-12 col-lg-4">
          {/* Card 1: Channel & Meta Details */}
          <div className="card-modern mb-4">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-info-circle-fill text-primary" />
                <span className="fw-bold">Nguồn tuyển dụng & Hệ thống</span>
              </div>
            </div>

            <div className="card-modern-body">
              <div className="mb-3">
                <div className="text-secondary small fw-semibold mb-1.5">Kênh tuyển dụng tiếp nhận:</div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className={`source-badge ${sourceItem.colorClass}`}>
                    <i className={`bi ${sourceItem.icon}`} />
                    <span>{sourceItem.label}</span>
                  </span>
                </div>
                <div className="text-muted small mt-1">
                  {sourceItem.desc}
                </div>
              </div>

              <hr className="my-3 text-secondary-subtle" />

              <div className="d-flex flex-column gap-2.5 small">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-secondary">Mã ứng viên:</span>
                  <span className="fw-bold text-dark">#{c.id}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-secondary">Ngày tạo hồ sơ:</span>
                  <span className="fw-semibold text-dark">{formattedDate}</span>
                </div>
                {formattedTime && (
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-secondary">Thời gian ghi nhận:</span>
                    <span className="text-muted">{formattedTime}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-secondary">Trạng thái hồ sơ:</span>
                  <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2 py-1">
                    Đang hoạt động
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Related Applications Actions */}
          <div className="card-modern mb-4">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-folder-check text-primary" />
                <span className="fw-bold">Quy trình ứng tuyển</span>
              </div>
            </div>

            <div className="card-modern-body">
              <p className="text-secondary small mb-3">
                Xem hoặc tạo mới hồ sơ ứng tuyển liên kết với các vị trí tuyển dụng đang mở.
              </p>

              <div className="d-flex flex-column gap-2">
                {canEdit && (
                  <Link
                    to={`/applications/create?candidate_id=${c.id}`}
                    className="btn btn-primary-modern w-100 text-decoration-none d-flex align-items-center justify-content-center gap-1.5"
                  >
                    <i className="bi bi-plus-circle" />
                    <span>Tạo đơn ứng tuyển mới</span>
                  </Link>
                )}

                <Link
                  to={`/applications?keyword=${encodeURIComponent(c.full_name)}`}
                  className="btn btn-secondary-modern w-100 text-decoration-none d-flex align-items-center justify-content-center gap-1.5"
                >
                  <i className="bi bi-search" />
                  <span>Xem hồ sơ ứng tuyển</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: AI Recruitment Assistant Prompt */}
          <div className="candidate-ai-card p-3.5 mb-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-2"
                style={{ width: '28px', height: '28px', backgroundColor: '#EDE9FE', color: '#7C3AED' }}
              >
                <i className="bi bi-stars" />
              </span>
              <span className="fw-bold text-dark" style={{ color: '#5B21B6' }}>
                Trợ lý AI Tuyển dụng
              </span>
            </div>

            <p className="text-secondary small mb-3" style={{ lineHeight: '1.55' }}>
              Đặt câu hỏi cho AI RAG để tóm tắt điểm mạnh, phân tích năng lực hoặc so khớp ứng viên này với các vị trí tuyển dụng.
            </p>

            <Link
              to={`/ai-chat?query=${encodeURIComponent(`Tóm tắt thông tin và đánh giá năng lực của ứng viên ${c.full_name}`)}`}
              className="btn btn-outline-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-1.5 fw-semibold"
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              <i className="bi bi-chat-quote-fill" />
              <span>Hỏi AI về ứng viên này</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
