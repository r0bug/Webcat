import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ItemsPage from './pages/ItemsPage';
import ForumPage from './pages/ForumPage';
import ForumPostPage from './pages/ForumPostPage';
import CalendarPage from './pages/CalendarPage';
import Documentation from './pages/Documentation';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import ImprovedThemeEditor from './components/admin/ImprovedThemeEditor';
import MyItemsPage from './pages/MyItemsPage';
import ItemImagesPage from './pages/ItemImagesPage';
import ItemDetailPage from './pages/ItemDetailPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Router basename="/webcat">
            <Layout>
              <Routes>
                <Route path="/" element={<ItemsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/items" element={<ItemsPage />} />
                <Route path="/items/my-items" element={
                  <ProtectedRoute>
                    <MyItemsPage />
                  </ProtectedRoute>
                } />
                <Route path="/items/:slug" element={<ItemDetailPage />} />
                <Route path="/items/:slug/images" element={
                  <ProtectedRoute>
                    <ItemImagesPage />
                  </ProtectedRoute>
                } />
                <Route path="/messages" element={<div>Messages - Coming Soon</div>} />
                <Route path="/forum" element={<ForumPage />} />
                <Route path="/forum/post/:id" element={<ForumPostPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/docs" element={<Documentation />} />
                <Route path="/profile" element={<div>Profile - Coming Soon</div>} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/theme" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <ImprovedThemeEditor />
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;