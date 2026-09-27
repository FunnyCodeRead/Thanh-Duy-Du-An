import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import PageHeader from '../components/PageHeader'
import { jobApi } from '../services/api'

const COMMON_DEPARTMENTS = [
  'Kỹ thuật / Công nghệ',
  'Sản phẩm & Thiết kế',
  'Marketing & Truyền thông',
  'Kinh doanh / Sales',
  'Nhân sự & Vận hành',
]

const POPULAR_SKILLS = [
  'Python',
  'Flask',
  'React',
  'Node.js',
  'JavaScript',
  'Docker',
  'MySQL',
  'PostgreSQL',
  'Git',
  'REST API',
]

const TITLE_SUGGESTIONS = [
  'Backend Developer (Python)',
  'Frontend Developer (React)',
  'Fullstack Engineer',
  'Product Manager',
  'Chuyên viên Tuyển dụng (HR)',
]

const emptyJob = {
  title: '',
  department: '',
  description: '',
  requirements: '',
  skills: '',
  quantity: 1,
  status: 'OPEN',
}

export default function JobFormPage() {
  const { user } = useOutletContext()
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)

  const [form, setForm] = useState(emptyJob)
  const [state, setState] = useState({ loading: editing, saving: false, error: '' })

  useEffect(() => {
    if (!editing) return
    jobApi
      .get(id)
      .then((result) => {
        setForm(result.data)
        setState({ loading: false, saving: false, error: '' })
      })
      .catch((error) => setState({ loading: false, saving: false, error: error.message }))
  }, [editing, id])

  if (!['ADMIN', 'HR'].includes(user?.role)) {
    return (
      <div className="alert alert-danger rounded-3 my-4">
        Bạn không có quyền thêm hoặc chỉnh sửa vị trí tuyển dụng.
      </div>
    )
  }

  if (state.loading) return <Loading message="Đang tải thông tin vị trí..." />

  async function submit(event) {
    event.preventDefault()
    setState({ ...state, saving: true, error: '' })
    try {
      if (editing) await jobApi.update(id, form)
      else await jobApi.create(form)
      navigate('/jobs')
    } catch (error) {
      setState({ ...state, saving: false, error: error.message })
    }
  }

  const field = (name) => ({
    value: form[name] ?? '',
    onChange: (e) => setForm({ ...form, [name]: e.target.value }),
  })

  function handleAddSkill(sk) {
    const current = (form.skills || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (!current.includes(sk)) {
      current.push(sk)
      setForm({ ...form, skills: current.join(', ') })
    }
  }

  function handleRemoveSkill(sk) {
    const current = (form.skills || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const next = current.filter((item) => item !== sk)
    setForm({ ...form, skills: next.join(', ') })
  }

  const currentSkillList = (form.skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <div className="form-page pb-5">
      <PageHeader
        title={editing ? 'Chỉnh sửa Vị trí Tuyển dụng' : 'Thêm Vị trí Tuyển dụng Mới'}
        description="Điền thông tin chi tiết về vị trí, mô tả công việc và yêu cầu kỹ năng tuyển dụng."
        action={
          <Link to="/jobs" className="btn btn-secondary-modern btn-sm text-decoration-none">
            <i className="bi bi-arrow-left" />
            <span>Quay lại danh sách</span>
          </Link>
        }
      />

      {state.error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-4 shadow-sm">
          <i className="bi bi-exclamation-octagon-fill text-danger fs-5" />
          <div className="fw-medium">{state.error}</div>
        </div>
      )}

      <form onSubmit={submit}>
        <div className="row g-4">
          {/* ================= LEFT COLUMN: Core Content (8 cols) ================= */}
          <div className="col-12 col-lg-8">
            <div className="d-flex flex-column gap-4">
              {/* Card 1: Thông tin chức danh & Mô tả */}
              <div className="card-modern">
                <div className="card-modern-header d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded-circle text-primary"
                      style={{ width: '28px', height: '28px', backgroundColor: 'var(--primary-soft)' }}
                    >
                      <i className="bi bi-briefcase-fill" />
                    </span>
                    <span className="fw-bold">1. Thông tin chức danh tuyển dụng</span>
                  </div>
                  <span className="text-muted small">
                    <span className="text-danger fw-bold">*</span> Trường bắt buộc
                  </span>
                </div>

                <div className="card-modern-body">
                  {/* Job Title */}
                  <div className="mb-4">
                    <label className="form-label small fw-semibold text-secondary d-flex justify-content-between">
                      <span>
                        Tên vị trí tuyển dụng <span className="text-danger">*</span>
                      </span>
                    </label>
                    <div className="input-icon-group">
                      <i className="bi bi-person-badge text-primary" />
                      <input
                        className="form-control form-control-lg"
                        placeholder="Ví dụ: Backend Developer (Python / Flask)"
                        required
                        style={{ fontSize: '0.96rem' }}
                        {...field('title')}
                      />
                    </div>

                    {/* Quick Title Suggestions */}
                    {!editing && !form.title && (
                      <div className="d-flex align-items-center gap-1.5 flex-wrap mt-2 pt-1">
                        <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
                          <i className="bi bi-lightbulb-fill text-warning me-1" />
                          Gợi ý nhanh:
                        </span>
                        {TITLE_SUGGESTIONS.map((t, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="btn btn-sm btn-light border py-0.5 px-2 rounded-pill small text-secondary"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => setForm({ ...form, title: t })}
                          >
                            + {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Job Description */}
                  <div className="mb-4">
                    <label className="form-label small fw-semibold text-secondary">
                      Mô tả công việc & Trách nhiệm chính <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows="6"
                      placeholder="Mô tả chi tiết các nhiệm vụ hàng ngày, quy trình làm việc, dự án tham gia và mục tiêu cần đạt được..."
                      required
                      style={{ height: 'auto', lineHeight: 1.6 }}
                      {...field('description')}
                    />
                    <div className="d-flex align-items-center gap-1.5 text-muted small mt-1.5" style={{ fontSize: '0.79rem' }}>
                      <i className="bi bi-info-circle text-primary" />
                      <span>Mô tả càng chi tiết sẽ giúp trợ lý AI sàng lọc và tóm tắt CV chính xác hơn.</span>
                    </div>
                  </div>

                  {/* Candidate Requirements */}
                  <div>
                    <label className="form-label small fw-semibold text-secondary">
                      Yêu cầu ứng viên (Kinh nghiệm, Học vấn & Năng lực)
                    </label>
                    <textarea
                      className="form-control"
                      rows="5"
                      placeholder="Ví dụ: Tốt nghiệp Đại học chuyên ngành CNTT, có từ 2+ năm kinh nghiệm với Python/Flask, tư duy logic tốt, khả năng đọc tài liệu tiếng Anh..."
                      style={{ height: 'auto', lineHeight: 1.6 }}
                      {...field('requirements')}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Kỹ năng chuyên môn & Tech Stack */}
              <div className="card-modern">
                <div className="card-modern-header d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded-circle text-primary"
                      style={{ width: '28px', height: '28px', backgroundColor: 'var(--primary-soft)' }}
                    >
                      <i className="bi bi-cpu-fill" />
                    </span>
                    <span className="fw-bold">2. Kỹ năng chuyên môn & Công nghệ</span>
                  </div>
                </div>

                <div className="card-modern-body">
                  <label className="form-label small fw-semibold text-secondary">
                    Kỹ năng yêu cầu (Nhập và ngăn cách bằng dấu phẩy)
                  </label>
                  <div className="input-icon-group mb-3">
                    <i className="bi bi-tags text-primary" />
                    <input
                      className="form-control"
                      placeholder="Ví dụ: Python, Flask, React, Docker, MySQL"
                      {...field('skills')}
                    />
                  </div>

                  {/* Live Skill Pills Preview */}
                  {currentSkillList.length > 0 && (
                    <div className="p-3 rounded-3 bg-light border mb-3">
                      <span className="small text-muted d-block mb-2 fw-semibold">
                        <i className="bi bi-check2-circle text-success me-1" />
                        Các kỹ năng đã nhận diện ({currentSkillList.length}):
                      </span>
                      <div className="d-flex flex-wrap gap-2">
                        {currentSkillList.map((sk, idx) => (
                          <span
                            key={idx}
                            className="skill-pill d-inline-flex align-items-center gap-1.5 shadow-2xs"
                            title="Click để xóa"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleRemoveSkill(sk)}
                          >
                            <span>{sk}</span>
                            <i className="bi bi-x-circle-fill text-muted" style={{ fontSize: '0.75rem' }} />
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Skill Suggestions */}
                  <div className="pt-1">
                    <span className="small text-muted d-block mb-2">
                      <i className="bi bi-plus-circle text-primary me-1" />
                      Chọn nhanh kỹ năng phổ biến:
                    </span>
                    <div className="d-flex flex-wrap gap-1.5">
                      {POPULAR_SKILLS.map((sk, idx) => {
                        const isAdded = currentSkillList.includes(sk)
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`btn btn-sm rounded-pill px-2.5 py-1 small ${
                              isAdded
                                ? 'btn-primary-modern text-white'
                                : 'btn-light border text-secondary'
                            }`}
                            style={{ fontSize: '0.78rem' }}
                            onClick={() => (isAdded ? handleRemoveSkill(sk) : handleAddSkill(sk))}
                          >
                            {isAdded ? `✓ ${sk}` : `+ ${sk}`}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Recruitment Parameters (4 cols) ================= */}
          <div className="col-12 col-lg-4">
            <div className="d-flex flex-column gap-4">
              {/* Card 3: Tham số tuyển dụng */}
              <div className="card-modern">
                <div className="card-modern-header">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded-circle text-primary"
                      style={{ width: '28px', height: '28px', backgroundColor: 'var(--primary-soft)' }}
                    >
                      <i className="bi bi-sliders" />
                    </span>
                    <span className="fw-bold">3. Thiết lập vị trí</span>
                  </div>
                </div>

                <div className="card-modern-body">
                  {/* Department */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Phòng ban / Đơn vị
                    </label>
                    <div className="input-icon-group">
                      <i className="bi bi-building text-primary" />
                      <input
                        className="form-control"
                        placeholder="Ví dụ: Kỹ thuật / Công nghệ"
                        {...field('department')}
                      />
                    </div>

                    {/* Department Quick Suggestions */}
                    <div className="d-flex flex-wrap gap-1 mt-2">
                      {COMMON_DEPARTMENTS.map((dept, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="btn btn-sm btn-light border py-0.5 px-2 rounded-pill small text-secondary"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => setForm({ ...form, department: dept })}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Chỉ tiêu số lượng cần tuyển
                    </label>
                    <div className="input-icon-group">
                      <i className="bi bi-people-fill text-primary" />
                      <input
                        className="form-control"
                        type="number"
                        min="1"
                        placeholder="1"
                        required
                        {...field('quantity')}
                      />
                    </div>
                    <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                      Số lượng nhân sự dự kiến tiếp nhận.
                    </span>
                  </div>

                  {/* Recruitment Status */}
                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-secondary">
                      Trạng thái tin tuyển dụng
                    </label>
                    <div className="d-flex flex-column gap-2">
                      <label
                        className={`p-2.5 rounded-3 border d-flex align-items-center gap-2.5 cursor-pointer transition-all ${
                          form.status === 'OPEN'
                            ? 'bg-success-subtle border-success text-success'
                            : 'bg-white text-secondary'
                        }`}
                        style={{ cursor: 'pointer' }}
                      >
                        <input
                          type="radio"
                          name="statusRadio"
                          className="form-check-input mt-0 flex-shrink-0"
                          checked={form.status === 'OPEN'}
                          onChange={() => setForm({ ...form, status: 'OPEN' })}
                        />
                        <div>
                          <div className="fw-semibold small text-dark d-flex align-items-center gap-1.5">
                            <span className="bg-success rounded-circle d-inline-block" style={{ width: '8px', height: '8px' }} />
                            <span>Đang mở tuyển (Active)</span>
                          </div>
                          <span className="text-muted" style={{ fontSize: '0.73rem' }}>
                            Sẵn sàng tiếp nhận và sàng lọc hồ sơ ứng viên.
                          </span>
                        </div>
                      </label>

                      <label
                        className={`p-2.5 rounded-3 border d-flex align-items-center gap-2.5 cursor-pointer transition-all ${
                          form.status === 'CLOSED'
                            ? 'bg-light border-secondary text-secondary'
                            : 'bg-white text-secondary'
                        }`}
                        style={{ cursor: 'pointer' }}
                      >
                        <input
                          type="radio"
                          name="statusRadio"
                          className="form-check-input mt-0 flex-shrink-0"
                          checked={form.status === 'CLOSED'}
                          onChange={() => setForm({ ...form, status: 'CLOSED' })}
                        />
                        <div>
                          <div className="fw-semibold small text-dark d-flex align-items-center gap-1.5">
                            <span className="bg-secondary rounded-circle d-inline-block" style={{ width: '8px', height: '8px' }} />
                            <span>Đã đóng tuyển (Closed)</span>
                          </div>
                          <span className="text-muted" style={{ fontSize: '0.73rem' }}>
                            Tạm dừng quy trình ứng tuyển cho vị trí này.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Trợ lý AI Thông minh */}
              <div
                className="p-3.5 rounded-3 border"
                style={{
                  backgroundColor: '#f8faff',
                  borderColor: '#bfdbfe',
                }}
              >
                <div className="d-flex align-items-start gap-2.5">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-2xs"
                    style={{ width: '32px', height: '32px', backgroundColor: '#2563EB', color: '#ffffff' }}
                  >
                    <i className="bi bi-robot" />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1" style={{ color: '#1e40af', fontSize: '0.88rem' }}>
                      Trợ lý AI Tự động hóa
                    </h6>
                    <p className="mb-0 text-secondary" style={{ fontSize: '0.785rem', lineHeight: 1.5 }}>
                      Sau khi lưu vị trí, hệ thống AI sẽ tự động phân tích các CV ứng tuyển nộp vào để đối chiếu với mô tả và kỹ năng bạn thiết lập ở đây.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Action Controls (Sticky / Clear) */}
              <div className="card-modern p-3">
                <div className="d-flex flex-column gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary-modern py-2.5 w-100 justify-content-center shadow-sm"
                    disabled={state.saving}
                  >
                    {state.saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" />
                        <span>Đang lưu vị trí...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2-circle fs-6" />
                        <span>{editing ? 'Cập nhật thay đổi' : 'Lưu vị trí tuyển dụng'}</span>
                      </>
                    )}
                  </button>
                  <Link
                    to="/jobs"
                    className="btn btn-secondary-modern py-2 w-100 justify-content-center text-decoration-none"
                  >
                    <span>Hủy bỏ</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

