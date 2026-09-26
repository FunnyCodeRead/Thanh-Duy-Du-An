import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { authApi } from '../services/api'
import Loading from './Loading'

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState({ loading: true, user: null })
  useEffect(() => {
    let active = true
    authApi.me().then((result) => active && setState({ loading: false, user: result.user })).catch(() => active && setState({ loading: false, user: null }))
    return () => { active = false }
  }, [])
  if (state.loading) return <Loading />
  if (!state.user) return <Navigate to="/login" replace />
  return children(state.user)
}

