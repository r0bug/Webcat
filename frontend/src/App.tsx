import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ItemsPage from './pages/ItemsPage';
import ForumPage from './pages/ForumPage';
import ForumPostPage from './pages/ForumPostPage';
import CalendarPage from './pages/CalendarPage';
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
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<ItemsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/items" element={<ItemsPage />} />
              <Route path="/items/:slug" element={<div>Item Detail - Coming Soon</div>} />
              <Route path="/messages" element={<div>Messages - Coming Soon</div>} />
              <Route path="/forum" element={<ForumPage />} />
              <Route path="/forum/post/:id" element={<ForumPostPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/profile" element={<div>Profile - Coming Soon</div>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;