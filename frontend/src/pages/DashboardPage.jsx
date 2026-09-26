import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { apiRequest } from '../services/api'
import Loading from '../components/Loading'

const STATUS_CONFIG = {
  NEW: { label: 'Mới nhận (NEW)', color: 'secondary' },
  SCREENING: { label: 'Sàng lọc (SCREENING)', color: 'info' },
  INTERVIEW: { label: 'Phỏng vấn (INTERVIEW)', color: 'primary' },
  PASSED: { label: 'Trúng tuyển (PASSED)', color: 'success' },
  REJECTED: { label: 'Không đạt (REJECTED)', color: 'danger' },
}

const SOURCE_LABELS = {
  LINKEDIN: 'LinkedIn',
  FACEBOOK: 'Facebook',
  WEBSITE: 'Website công ty',
  JOB_SITE: 'Trang tuyển dụng',
  REFERRAL: 'Giới thiệu nội bộ',
  OTHER: 'Khác',
}

export default function DashboardPage() {
  const { user } = useOutletContext()
  const [state, setState] = useState({ loading: true, data: null, error: '' })

  useEffect(() => {
    apiRequest('/api/dashboard')
      .then((result) => setState({ loading: false, data: result.data, error: '' }))
      .catch((error) => setState({ loading: false, data: null, error: error.message }))
  }, [])

  if (state.loading) return <Loading />

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

  const summaryCards = [
    {
      label: 'Vị trí đang tuyển',
      value: summary.open_jobs,
      subtext: `Tổng cộng ${summary.total_jobs} vị trí`,
      link: '/jobs',
      badgeColor: 'success',
    },
    {
      label: 'Tổng ứng viên',
      value: summary.total_candidates,
      subtext: 'Hồ sơ ứng viên trong kho',
      link: '/candidates',
      badgeColor: 'primary',
    },
    {
      label: 'Hồ sơ ứng tuyển',
      value: summary.total_applications,
      subtext: 'Đang tham gia quy trình',
      link: '/applications',
      badgeColor: 'info',
    },
    {
      label: 'Phỏng vấn sắp tới',
      value: summary.upcoming_interviews,
      subtext: 'Lịch phỏng vấn sắp diễn ra',
      link: '/interviews',
      badgeColor: 'warning',
    },
  ]

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-1">Bảng điều khiển tuyển dụng</h1>
          <p className="text-muted mb-0">
            Xin chào, <strong>{user?.full_name}</strong> &bull; Vai trò: <span className="badge bg-secondary">{user?.role}</span>
          </p>
        </div>
      </div>

      {state.error && <div className="alert alert-danger mb-4">{state.error}</div>}

      {/* 1. Summary Cards */}
      <div className="row g-3 mb-4">
        {summaryCards.map((card) => (
          <div className="col-12 col-sm-6 col-xl-3" key={card.label}>
            <Link to={card.link} className="text-decoration-none text-reset">
              <div className="card h-100 shadow-sm border-0 summary-card">
                <div className="card-body">
                  <div className="text-muted small text-uppercase fw-semibold mb-1">{card.label}</div>
                  <div className="display-6 fw-bold mb-1">{card.value}</div>
                  <div className="text-muted small">{card.subtext}</div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        {/* 2. Application Status Distribution */}
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white py-3 border-bottom">
              <h2 className="h6 mb-0 fw-bold">Phân bố trạng thái hồ sơ ứng tuyển</h2>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                {Object.entries(STATUS_CONFIG).map(([stKey, conf]) => {
                  const count = appStatus[stKey] || 0
                  const pct = summary.total_applications > 0
                    ? Math.round((count / summary.total_applications) * 100)
                    : 0
                  return (
                    <div className="list-group-item d-flex justify-content-between align-items-center px-0 py-2" key={stKey}>
                      <div className="d-flex align-items-center">
                        <span className={`badge bg-${conf.color} me-2`}>&bull;</span>
                        <span>{conf.label}</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <span className="fw-semibold me-2">{count}</span>
                        <span className="text-muted small">({pct}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Candidate Sources Statistics */}
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white py-3 border-bottom">
              <h2 className="h6 mb-0 fw-bold">Nguồn ứng viên</h2>
            </div>
            <div className="card-body">
              {candidateSources.length === 0 ? (
                <p className="text-muted mb-0">Chưa có dữ liệu nguồn ứng viên.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {candidateSources.map((item) => {
                    const label = SOURCE_LABELS[item.source] || item.source
                    const count = item.count || 0
                    const pct = totalSourceCandidates > 0
                      ? Math.round((count / totalSourceCandidates) * 100)
                      : 0
                    return (
                      <div key={item.source}>
                        <div className="d-flex justify-content-between small mb-1">
                          <span className="fw-semibold">{label}</span>
                          <span className="text-muted">{count} ứng viên ({pct}%)</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div
                            className="progress-bar bg-primary"
                            role="progressbar"
                            style={{ width: `${pct}%` }}
                            aria-valuenow={pct}
                            aria-valuemin="0"
                            aria-valuemax="100"
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

      <div className="row g-4 mb-4">
        {/* 4. Pass Rate */}
        <div className="col-md-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white py-3 border-bottom">
              <h2 className="h6 mb-0 fw-bold">Tỷ lệ trúng tuyển (Pass Rate)</h2>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="display-6 fw-bold text-success me-3">{passRate.rate}%</span>
                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                  Đã kết thúc: {passRate.finalized}
                </span>
              </div>
              <p className="text-muted small mb-2">
                <strong>Công thức:</strong> <code>PASSED / (PASSED + REJECTED) &times; 100%</code>
              </p>
              <div className="text-muted small">
                Chi tiết: <strong>{passRate.passed}</strong> trúng tuyển (PASSED), <strong>{passRate.rejected}</strong> không đạt (REJECTED) trên tổng số <strong>{passRate.finalized}</strong> hồ sơ đã hoàn tất quy trình đánh giá.
              </div>
            </div>
          </div>
        </div>

        {/* 5. Hiring Time / Data Limitation */}
        <div className="col-md-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white py-3 border-bottom">
              <h2 className="h6 mb-0 fw-bold">Thời gian tuyển dụng (Time-to-Hire)</h2>
            </div>
            <div className="card-body">
              <div className="alert alert-secondary py-2 px-3 mb-2 small">
                <i className="bi bi-info-circle me-1"></i>
                <strong>Giới hạn dữ liệu:</strong> {hiringTime.message}
              </div>
              <p className="text-muted small mb-0">
                Cơ sở dữ liệu chỉ lưu mốc thời gian tạo hồ sơ (<code>applied_at</code>) mà không lưu mốc thời gian chuyển sang trạng thái kết thúc (<code>PASSED</code> / <code>REJECTED</code>). Hệ thống tuân thủ nguyên tắc không suy đoán hoặc bịa số liệu thống kê.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Upcoming Interviews Table */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h2 className="h6 mb-0 fw-bold">Lịch phỏng vấn sắp tới</h2>
          <Link to="/interviews" className="btn btn-sm btn-outline-primary">
            Xem tất cả lịch phỏng vấn
          </Link>
        </div>
        <div className="card-body p-0">
          {upcomingInterviews.length === 0 ? (
            <div className="p-4 text-center text-muted">
              Hiện không có lịch phỏng vấn nào sắp diễn ra.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase text-muted">
                  <tr>
                    <th>Ứng viên</th>
                    <th>Vị trí</th>
                    <th>Thời gian phỏng vấn</th>
                    <th>Người phỏng vấn</th>
                    <th>Địa điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingInterviews.map((iv) => (
                    <tr key={iv.id}>
                      <td className="fw-semibold">{iv.candidate_name}</td>
                      <td>{iv.job_title}</td>
                      <td className="text-primary fw-medium">{iv.interview_date}</td>
                      <td>{iv.interviewer_name}</td>
                      <td><span className="badge bg-light text-dark border">{iv.location || 'Chưa cập nhật'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
