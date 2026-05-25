import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import StudentAssignments from './pages/student/Assignments';
import StudentProgress from './pages/student/Progress';
import Profile from './pages/student/Profile';

// Mentor pages
import MentorDashboard from './pages/mentor/Dashboard';
import MentorEvaluate from './pages/mentor/Evaluate';
import MentorStudents from './pages/mentor/Students';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminAnalytics from './pages/admin/Analytics';
import AdminUsers from './pages/admin/Users';
import AdminSkills from './pages/admin/Skills';
import AdminModules from './pages/admin/Modules';

// Shared profile for mentor
const MentorProfile = () => {
  // Re-use the same Profile component
  return <Profile />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1c2030',
                color: '#e2e8f0',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                fontSize: '13px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#0a0b0f' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#0a0b0f' } },
            }}
          />

          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Student routes */}
            <Route path="/student/dashboard" element={
              <ProtectedRoute roles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/assignments" element={
              <ProtectedRoute roles={['student']}>
                <StudentAssignments />
              </ProtectedRoute>
            } />
            <Route path="/student/progress" element={
              <ProtectedRoute roles={['student']}>
                <StudentProgress />
              </ProtectedRoute>
            } />
            <Route path="/student/profile" element={
              <ProtectedRoute roles={['student']}>
                <Profile />
              </ProtectedRoute>
            } />

            {/* Mentor routes */}
            <Route path="/mentor/dashboard" element={
              <ProtectedRoute roles={['mentor']}>
                <MentorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/mentor/evaluate" element={
              <ProtectedRoute roles={['mentor']}>
                <MentorEvaluate />
              </ProtectedRoute>
            } />
            <Route path="/mentor/students" element={
              <ProtectedRoute roles={['mentor']}>
                <MentorStudents />
              </ProtectedRoute>
            } />
            <Route path="/mentor/profile" element={
              <ProtectedRoute roles={['mentor']}>
                <Profile />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute roles={['admin']}>
                <AdminAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute roles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/skills" element={
              <ProtectedRoute roles={['admin']}>
                <AdminSkills />
              </ProtectedRoute>
            } />
            <Route path="/admin/modules" element={
              <ProtectedRoute roles={['admin']}>
                <AdminModules />
              </ProtectedRoute>
            } />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
