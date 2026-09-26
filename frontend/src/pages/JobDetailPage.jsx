import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import { jobApi } from '../services/api'
export default function JobDetailPage() {
  const { user } = useOutletContext(); const { id } = useParams(); const [state, setState] = useState({ loading: true, data: null, error: '' })
  useEffect(() => { jobApi.get(id).then((result) => setState({ loading: false, data: result.data, error: '' })).catch((error) => setState({ loading: false, data: null, error: error.message })) }, [id])
  if (state.loading) return <Loading />; if (state.error) return <div className="alert alert-danger">{state.error}</div>; const job = state.data
  return <><div className="d-flex justify-content-between align-items-center mb-3"><h1 className="h3 mb-0">{job.title}</h1><div><Link className="btn btn-outline-secondary me-2" to="/jobs">Quay lại</Link>{['ADMIN', 'HR'].includes(user.role) && <Link className="btn btn-primary" to={`/jobs/${id}/edit`}>Sửa</Link>}</div></div><div className="card shadow-sm border-0"><div className="card-body"><dl className="row mb-0"><dt className="col-sm-3">Phòng ban</dt><dd className="col-sm-9">{job.department || '-'}</dd><dt className="col-sm-3">Trạng thái</dt><dd className="col-sm-9">{job.status}</dd><dt className="col-sm-3">Số lượng</dt><dd className="col-sm-9">{job.quantity}</dd><dt className="col-sm-3">Kỹ năng</dt><dd className="col-sm-9">{job.skills || '-'}</dd><dt className="col-sm-3">Mô tả</dt><dd className="col-sm-9 text-preline">{job.description}</dd><dt className="col-sm-3">Yêu cầu</dt><dd className="col-sm-9 text-preline">{job.requirements || '-'}</dd><dt className="col-sm-3">Hồ sơ ứng tuyển</dt><dd className="col-sm-9">{job.application_count}</dd><dt className="col-sm-3">Ngày tạo</dt><dd className="col-sm-9">{new Date(job.created_at).toLocaleString('vi-VN')}</dd></dl></div></div></>
}

