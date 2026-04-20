import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AboutPage from './pages/AboutPage';
import Home from './pages/Home';
import Verification from './pages/Verification';
import MemberDashboard from "./pages/MemberDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminPortal from "./pages/AdminPortal";
import AdminRoute from "./components/AdminRoute";
import Donate from './pages/Donate';
import RegisterPage from './pages/RegisterPage';
import MemberLogin from './pages/MemberLogin';
import ResetPassword from './pages/ResetPassword';
import FloatingWhatsApp from './components/FloatingWhatsApp';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<MemberLogin />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path='/verification' element={<Verification />} />
        <Route path="/dashboard" element={<MemberDashboard />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-portal" element={
          <AdminRoute>
            <AdminPortal />
          </AdminRoute>
        } />
      </Routes>
      <FloatingWhatsApp />
    </Router>
  )
}

export default App
