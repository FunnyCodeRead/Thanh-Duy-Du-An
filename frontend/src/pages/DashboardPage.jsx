import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { apiRequest } from '../services/api'
import Loading from '../components/Loading'

const STATUS_CONFIG = {
  NEW: { label: 'Mới nhận', en: 'NEW', colorClass: 'soft-badge-secondary', dotColor: '#94a3b8' },
  SCREENING: { label: 'Sàng lọc CV', en: 'SCREENING', colorClass: 'soft-badge-info', dotColor: '#0284c7' },
  INTERVIEW: { label: 'Phỏng vấn', en: 'INTERVIEW', colorClass: 'soft-badge-purple', dotColor: '#7c3aed' },
  PASSED: { label: 'Trúng tuyển', en: 'PASSED', colorClass: 'soft-badge-success', dotColor: '#059669' },
  REJECTED: { label: 'Không đạt', en: 'REJECTED', colorClass: 'soft-badge-danger', dotColor: '#dc2626' },
}

const SOURCE_CONFIG = {
  LINKEDIN: { label: 'LinkedIn', icon: 'bi-linkedin', color: '#0a66c2' },
  FACEBOOK: { label: 'Facebook', icon: 'bi-facebook', color: '#1877f2' },
  WEBSITE: { label: 'Website công ty', icon: 'bi-globe2', color: '#059669' },
  JOB_SITE: { label: 'Trang tuyển dụng', icon: 'bi-briefcase', color: '#f59e0b' },
  REFERRAL: { label: 'Giới thiệu nội bộ', icon: 'bi-people', color: '#8b5cf6' },
  OTHER: { label: 'Nguồn khác', icon: 'bi-three-dots', color: '#64748b' },
}

export default function DashboardPage() {
  const { user } = useOutletContext()
  const [state, setState] = useState({ loading: true, data: null, error: '' })

  const fetchDashboard = () => {
    setState((prev) => ({ ...prev, loading: true }))
    apiRequest('/api/dashboard')
      .then((result) => setState({ loading: false, data: result.data, error: '' }))
      .catch((error) => setState({ loading: false, data: null, error: error.message }))
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (state.loading && !state.data) return <Loading message="Đang tải dữ liệu bảng điều khiển..." />

  const summary = state.data?.summary || {
    open_jobs: state.data?.jobs ?? 0,
    total_jobs: state.data?.jobs ?? 0,
    total_candidates: state.data?.candidates ?? 0,
    total_applications: state.data?.applications ?? 0,
    upcoming_interviews: 0,
  }

  const appStatus = state.data?.application_status || {
    NEW: 0,
    SCREENING: 0,
    INTERVIEW: 0,
    PASSED: 0,
    REJECTED: 0,
  }

  const candidateSources = state.data?.candidate_sources || []
  const totalSourceCandidates = candidateSources.reduce((acc, curr) => acc + (curr.count || 0), 0)

  const passRate = state.data?.pass_rate || {
    passed: 0,
    rejected: 0,
    finalized: 0,
    rate: 0.0,
  }

  const hiringTime = state.data?.hiring_time || {
    available: false,
    average_days: null,
    message: 'Chưa đủ dữ liệu để tính chính xác.',
  }

  const upcomingInterviews = state.data?.upcoming_interviews || []

  return (
    <>
      {/* Top Welcome Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h3 fw-bold mb-0 text-dark">Tổng quan Tuyển dụng</h1>
            <span className="soft-badge soft-badge-primary">Smart ATS</span>
          </div>
          <p className="text-muted mb-0 small">
            Chào mừng trở lại, <strong>{user?.full_name}</strong>! Theo dõi tiến độ tuyển dụng và chỉ số hôm nay.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary-modern btn-sm"
            onClick={fetchDashboard}
            title="Làm mới số liệu"
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Làm mới</span>
          </button>
          {['ADMIN', 'HR'].includes(user?.role) && (
            <Link to="/jobs/new" className="btn btn-primary-modern btn-sm text-decoration-none">
              <i className="bi bi-plus-lg"></i>
              <span>Đăng tuyển vị trí</span>
            </Link>
          )}
        </div>
      </div>

      {state.error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-4">
          <i className="bi bi-exclamation-circle-fill"></i>
          <div>{state.error}</div>
        </div>
      )}

      {/* 1. Modern KPI Cards Grid */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <Link to="/jobs" className="text-decoration-none">
            <div className="kpi-card h-100">
              <div>
                <div className="kpi-label">Vị trí đang mở</div>
                <div className="kpi-value text-primary">{summary.open_jobs}</div>
                <div className="text-muted small mt-1">
                  Trên tổng số <strong>{summary.total_jobs}</strong> vị trí
                </div>
              </div>
              <div className="kpi-icon-bubble kpi-indigo">
                <i className="bi bi-briefcase-fill"></i>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <Link to="/candidates" className="text-decoration-none">
            <div className="kpi-card h-100">
              <div>
                <div className="kpi-label">Tổng ứng viên</div>
                <div className="kpi-value text-dark">{summary.total_candidates}</div>
                <div className="text-muted small mt-1">Kho dữ liệu hồ sơ CV</div>
              </div>
              <div className="kpi-icon-bubble kpi-blue">
                <i className="bi bi-people-fill"></i>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <Link to="/applications" className="text-decoration-none">
            <div className="kpi-card h-100">
              <div>
                <div className="kpi-label">Hồ sơ ứng tuyển</div>
                <div className="kpi-value text-dark">{summary.total_applications}</div>
                <div className="text-muted small mt-1">Đang trong quy trình</div>
              </div>
              <div className="kpi-icon-bubble kpi-emerald">
                <i className="bi bi-file-earmark-person-fill"></i>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <Link to="/interviews" className="text-decoration-none">
            <div className="kpi-card h-100">
              <div>
                <div className="kpi-label">Phỏng vấn sắp tới</div>
                <div className="kpi-value text-warning" style={{ color: '#d97706' }}>
                  {summary.upcoming_interviews}
                </div>
                <div className="text-muted small mt-1">Lịch hẹn đã lên kế hoạch</div>
              </div>
              <div className="kpi-icon-bubble kpi-amber">
                <i className="bi bi-calendar-event-fill"></i>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* 2. Middle Row: Application Status Pipeline & Candidate Sources */}
      <div className="row g-4 mb-4">
        {/* Pipeline Distribution */}
        <div className="col-12 col-lg-7">
          <div className="card-modern h-100">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-funnel-fill text-primary"></i>
                <span>Phân bố trạng thái hồ sơ ứng tuyển</span>
              </div>
              <span className="text-muted small fw-normal">
                Tổng cộng {summary.total_applications} hồ sơ
              </span>
            </div>
            <div className="card-modern-body">
              <div className="d-flex flex-column gap-3">
                {Object.entries(STATUS_CONFIG).map(([stKey, conf]) => {
                  const count = appStatus[stKey] || 0
                  const pct =
                    summary.total_applications > 0
                      ? Math.round((count / summary.total_applications) * 100)
                      : 0

                  return (
                    <div key={stKey}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: conf.dotColor,
                              display: 'inline-block',
                            }}
                          />
                          <span className="fw-semibold small">{conf.label}</span>
                          <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                            ({conf.en})
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold small">{count} hồ sơ</span>
                          <span className="text-muted small" style={{ minWidth: '40px', textAlign: 'right' }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="progress" style={{ height: '7px', backgroundColor: '#f1f5f9' }}>
                        <div
                          className="progress-bar rounded-pill"
                          role="progressbar"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: conf.dotColor,
                            transition: 'width 0.4s ease',
                          }}
                          aria-valuenow={pct}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Sources */}
        <div className="col-12 col-lg-5">
          <div className="card-modern h-100">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-pie-chart-fill text-indigo" style={{ color: '#4f46e5' }}></i>
                <span>Cơ cấu nguồn ứng viên</span>
              </div>
              <span className="text-muted small fw-normal">
                {totalSourceCandidates} ứng viên
              </span>
            </div>
            <div className="card-modern-body">
              {candidateSources.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  <i className="bi bi-inbox d-block fs-3 text-secondary mb-2"></i>
                  Chưa có dữ liệu nguồn ứng viên.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {candidateSources.map((item) => {
                    const conf = SOURCE_CONFIG[item.source] || {
                      label: item.source,
                      icon: 'bi-tag',
                      color: '#64748b',
                    }
                    const count = item.count || 0
                    const pct =
                      totalSourceCandidates > 0
                        ? Math.round((count / totalSourceCandidates) * 100)
                        : 0

                    return (
                      <div key={item.source}>
                        <div className="d-flex justify-content-between align-items-center small mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <i className={`bi ${conf.icon}`} style={{ color: conf.color }}></i>
                            <span className="fw-semibold">{conf.label}</span>
                          </div>
                          <span className="text-muted">
                            <strong>{count}</strong> ({pct}%)
                          </span>
                        </div>
                        <div className="progress" style={{ height: '6px', backgroundColor: '#f1f5f9' }}>
                          <div
                            className="progress-bar rounded-pill"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: conf.color,
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Pass Rate & Hiring Time Statement */}
      <div className="row g-4 mb-4">
        {/* Pass Rate Metric */}
        <div className="col-12 col-md-6">
          <div className="card-modern h-100">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-check2-circle text-success fs-5"></i>
                <span>Tỷ lệ trúng tuyển (Pass Rate)</span>
              </div>
              <span className="soft-badge soft-badge-success">Đã hoàn tất</span>
            </div>
            <div className="card-modern-body">
              <div className="d-flex align-items-baseline gap-3 mb-2">
                <div className="display-5 fw-bold text-success">{passRate.rate}%</div>
                <div className="text-muted small">
                  ({passRate.passed} đỗ / {passRate.finalized} hồ sơ đã có kết quả)
                </div>
              </div>
              <div className="progress mb-3" style={{ height: '8px', backgroundColor: '#e2e8f0' }}>
                <div
                  className="progress-bar bg-success rounded-pill"
                  style={{ width: `${Math.min(passRate.rate, 100)}%` }}
                />
              </div>
              <p className="text-muted small mb-0">
                <strong>Quy tắc tính toán:</strong> <code>PASSED / (PASSED + REJECTED) &times; 100%</code>. Các hồ sơ đang ở giai đoạn Sàng lọc hoặc Phỏng vấn chưa được tính vào mẫu số.
              </p>
            </div>
          </div>
        </div>

        {/* Time-to-Hire Limitation Statement */}
        <div className="col-12 col-md-6">
          <div className="card-modern h-100">
            <div className="card-modern-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-clock-history text-secondary fs-5"></i>
                <span>Thời gian tuyển dụng (Time-to-Hire)</span>
              </div>
              <span className="soft-badge soft-badge-secondary">Báo cáo dữ liệu</span>
            </div>
            <div className="card-modern-body">
              <div
                className="d-flex align-items-start gap-2 p-2.5 rounded-3 mb-2.5 small"
                style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                <i className="bi bi-info-circle-fill text-primary mt-0.5"></i>
                <div>
                  <strong className="text-dark">Giới hạn mô hình dữ liệu:</strong>{' '}
                  <span className="text-secondary">{hiringTime.message}</span>
                </div>
              </div>
              <p className="text-muted small mb-0">
                Theo quy chuẩn AI-SDLC, hệ thống kiên quyết không tạo số liệu giả lập. Do schema hiện tại chỉ lưu trữ ngày nộp ban đầu (<code>applied_at</code>) mà không lưu mốc thời gian hoàn thành (<code>completed_at</code>), chỉ số này được để trống trung thực.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Upcoming Interviews Table */}
      <div className="card-modern mb-4">
        <div className="card-modern-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-calendar-check-fill text-primary"></i>
            <span>5 buổi phỏng vấn sắp diễn ra gần nhất</span>
          </div>
          <Link to="/interviews" className="btn btn-sm btn-secondary-modern">
            <span>Xem tất cả lịch</span>
            <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
        <div className="card-modern-body p-0">
          {upcomingInterviews.length === 0 ? (
            <div className="empty-state-box border-0">
              <div className="empty-state-icon">
                <i className="bi bi-calendar-x"></i>
              </div>
              <h6 className="fw-semibold text-dark">Hiện chưa có lịch phỏng vấn nào</h6>
              <p className="text-muted small mb-3">Tất cả các buổi phỏng vấn đã hoàn tất hoặc chưa được lên lịch mới.</p>
              {['ADMIN', 'HR'].includes(user?.role) && (
                <Link to="/interviews/new" className="btn btn-primary-modern btn-sm text-decoration-none">
                  <i className="bi bi-plus-lg"></i>
                  <span>Lên lịch phỏng vấn ngay</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Ứng viên</th>
                    <th>Vị trí tuyển dụng</th>
                    <th>Thời gian phỏng vấn</th>
                    <th>Người phỏng vấn</th>
                    <th>Địa điểm / Hình thức</th>
                    <th style={{ width: '80px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingInterviews.map((iv) => {
                    const initials = (iv.candidate_name || 'U')
                      .split(' ')
                      .filter(Boolean)
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()

                    return (
                      <tr key={iv.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2.5">
                            <div className="table-avatar-initials">{initials}</div>
                            <span className="fw-semibold text-dark">{iv.candidate_name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="soft-badge soft-badge-secondary">{iv.job_title}</span>
                        </td>
                        <td>
                          <span className="text-primary fw-semibold small">
                            <i className="bi bi-clock me-1"></i>
                            {iv.interview_date}
                          </span>
                        </td>
                        <td>
                          <span className="small text-secondary">{iv.interviewer_name}</span>
                        </td>
                        <td>
                          <span className="small text-dark">
                            <i className="bi bi-geo-alt me-1 text-danger"></i>
                            {iv.location || 'Chưa cập nhật'}
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
