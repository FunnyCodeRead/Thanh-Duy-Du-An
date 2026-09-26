import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import JobsPage from './pages/JobsPage'
import JobFormPage from './pages/JobFormPage'
import JobDetailPage from './pages/JobDetailPage'
import CandidatesPage from './pages/CandidatesPage'
import CandidateFormPage from './pages/CandidateFormPage'
import CandidateDetailPage from './pages/CandidateDetailPage'
import ApplicationsPage from './pages/ApplicationsPage'
import ApplicationCreatePage from './pages/ApplicationCreatePage'
import ApplicationDetailPage from './pages/ApplicationDetailPage'
import InterviewsPage from './pages/InterviewsPage'
import InterviewFormPage from './pages/InterviewFormPage'
import InterviewDetailPage from './pages/InterviewDetailPage'
import EvaluationFormPage from './pages/EvaluationFormPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute>{(user) => <Layout user={user} />}</ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/create" element={<JobFormPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/jobs/:id/edit" element={<JobFormPage />} />
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/candidates/create" element={<CandidateFormPage />} />
        <Route path="/candidates/:id" element={<CandidateDetailPage />} />
        <Route path="/candidates/:id/edit" element={<CandidateFormPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/applications/create" element={<ApplicationCreatePage />} />
        <Route path="/applications/:id" element={<ApplicationDetailPage />} />
        <Route path="/interviews" element={<InterviewsPage />} />
        <Route path="/interviews/create" element={<InterviewFormPage />} />
        <Route path="/interviews/:id" element={<InterviewDetailPage />} />
        <Route path="/interviews/:id/edit" element={<InterviewFormPage />} />
        <Route path="/applications/:id/evaluations/create" element={<EvaluationFormPage />} />
        <Route path="/evaluations/:id/edit" element={<EvaluationFormPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}


