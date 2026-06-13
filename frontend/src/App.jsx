import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Map from './pages/Map';
import CheckIn from './pages/CheckIn';
import Admin from './pages/Admin';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Map /></ProtectedRoute>} />
          <Route path="/checkin/:qr" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="librarian"><Admin /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
