import { NavLink } from 'react-router-dom'
const activeClass = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`
export default function Sidebar() {
  return <aside className="sidebar p-3"><nav className="nav nav-pills flex-column gap-1"><NavLink className={activeClass} to="/dashboard">Dashboard</NavLink><NavLink className={activeClass} to="/jobs">Vị trí tuyển dụng</NavLink><NavLink className={activeClass} to="/candidates">Ứng viên</NavLink><span className="nav-link disabled">Hồ sơ ứng tuyển</span><span className="nav-link disabled">Phỏng vấn</span><span className="nav-link disabled">Đánh giá</span></nav></aside>
}

