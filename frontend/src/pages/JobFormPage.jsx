import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import { jobApi } from '../services/api'

const emptyJob = { title: '', department: '', description: '', requirements: '', skills: '', quantity: 1, status: 'OPEN' }
export default function JobFormPage() {
  const { user } = useOutletContext(); const { id } = useParams(); const navigate = useNavigate(); const editing = Boolean(id)
  const [form, setForm] = useState(emptyJob); const [state, setState] = useState({ loading: editing, saving: false, error: '' })
  useEffect(() => { if (!editing) return; jobApi.get(id).then((result) => { setForm(result.data); setState({ loading: false, saving: false, error: '' }) }).catch((error) => setState({ loading: false, saving: false, error: error.message })) }, [editing, id])
  if (!['ADMIN', 'HR'].includes(user.role)) return <div className="alert alert-danger">Bạn không có quyền thay đổi vị trí.</div>
  if (state.loading) return <Loading />
  async function submit(event) { event.preventDefault(); setState({ ...state, saving: true, error: '' }); try { if (editing) await jobApi.update(id, form); else await jobApi.create(form); navigate('/jobs') } catch (error) { setState({ ...state, saving: false, error: error.message }) } }
  const field = (name) => ({ value: form[name] ?? '', onChange: (e) => setForm({ ...form, [name]: e.target.value }) })
  return <div className="form-page mx-auto"><div className="d-flex justify-content-between mb-3"><h1 className="h3">{editing ? 'Sửa vị trí' : 'Thêm vị trí'}</h1><Link className="btn btn-outline-secondary" to="/jobs">Quay lại</Link></div>{state.error && <div className="alert alert-danger">{state.error}</div>}<form className="card card-body shadow-sm border-0" onSubmit={submit}><div className="row g-3"><div className="col-md-8"><label className="form-label">Tên vị trí *</label><input className="form-control" {...field('title')} /></div><div className="col-md-4"><label className="form-label">Phòng ban</label><input className="form-control" {...field('department')} /></div><div className="col-12"><label className="form-label">Mô tả *</label><textarea className="form-control" rows="4" {...field('description')} /></div><div className="col-12"><label className="form-label">Yêu cầu</label><textarea className="form-control" rows="3" {...field('requirements')} /></div><div className="col-md-6"><label className="form-label">Kỹ năng</label><input className="form-control" {...field('skills')} /></div><div className="col-md-3"><label className="form-label">Số lượng</label><input className="form-control" type="number" min="1" {...field('quantity')} /></div><div className="col-md-3"><label className="form-label">Trạng thái</label><select className="form-select" {...field('status')}><option>OPEN</option><option>CLOSED</option></select></div></div><div className="mt-4"><button className="btn btn-primary" disabled={state.saving}>{state.saving ? 'Đang lưu...' : 'Lưu vị trí'}</button></div></form></div>
}

