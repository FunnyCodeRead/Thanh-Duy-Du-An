import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import FloatingAIChat from './FloatingAIChat'

export default function Layout({ user }) {
  return (
    <div className="app-shell">
      <Navbar user={user} />
      <div className="app-body">
        <Sidebar user={user} />
        <main className="content-area-wrapper">
          <div className="content-area">
            <Outlet context={{ user }} />
          </div>
        </main>
      </div>
      <FloatingAIChat user={user} />
    </div>
  )
}

