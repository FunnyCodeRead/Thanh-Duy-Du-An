import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function Layout({ user }) {
  return (
    <div className="app-shell">
      <Navbar user={user} />
      <div className="app-body">
        <Sidebar user={user} />
        <main className="content-area">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  )
}
