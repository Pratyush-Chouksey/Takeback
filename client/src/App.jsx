import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import BorrowPage from './pages/BorrowPage';
import ReturnPage from './pages/ReturnPage';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { toast } = useAuth();

  return (
    <>
      <Navbar />
      {toast && (
        <div style={toastStyle}>
          {toast}
        </div>
      )}
      <Routes>
        <Route path="/borrow" element={<BorrowPage />} />
        <Route path="/return" element={<ReturnPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/borrow" replace />} />
      </Routes>
    </>
  );
}

const toastStyle = {
  position: 'fixed',
  bottom: 24,
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#1B4332',
  color: '#fff',
  padding: '10px 24px',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 500,
  zIndex: 9999,
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  animation: 'tb-toast-in 0.3s ease',
};

if (typeof document !== 'undefined' && !document.getElementById('tb-toast')) {
  const el = document.createElement('style'); el.id = 'tb-toast';
  el.textContent = `@keyframes tb-toast-in{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`;
  document.head.appendChild(el);
}
