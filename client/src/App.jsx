import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import BorrowPage from './pages/BorrowPage';
import ReturnPage from './pages/ReturnPage';
import AdminDashboard from './pages/AdminDashboard';
import LandingPage from './pages/LandingPage';
import EnterCupPage from './pages/EnterCupPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/enter-cup" element={<EnterCupPage />} />
        <Route path="/borrow" element={<ProtectedRoute><BorrowPage /></ProtectedRoute>} />
        <Route path="/return" element={<ProtectedRoute><ReturnPage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
