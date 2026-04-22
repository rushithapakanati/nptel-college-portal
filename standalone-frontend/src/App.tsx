import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppProvider } from './context/AppContext'
import YearSelectPage from './pages/YearSelectPage'
import PortalPage from './pages/PortalPage'
import CollegeSelectPage from './pages/CollegeSelectPage'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/StudentDashboard'
import HODDashboard from './pages/HODDashboard'
import DeanDashboard from './pages/DeanDashboard'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<YearSelectPage />} />
          <Route path="/portal" element={<PortalPage />} />
          <Route path="/college/:collegeName" element={<CollegeSelectPage />} />
          <Route path="/college/:collegeName/login/:role" element={<LoginPage />} />
          <Route path="/college/:collegeName/student" element={<StudentDashboard />} />
          <Route path="/college/:collegeName/hod/:branch" element={<HODDashboard />} />
          <Route path="/college/:collegeName/dean" element={<DeanDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </AppProvider>
  )
}
