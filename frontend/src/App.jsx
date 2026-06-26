import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AboutPage from './pages/AboutPage';
import Home from './pages/Home';
import Verification from './pages/Verification';
import MemberDashboard from "./pages/MemberDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminPortal from "./pages/AdminPortal";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import Donate from './pages/Donate';
import RegisterPage from './pages/RegisterPage';
import ExecutiveRegisterPage from './pages/ExecutiveRegisterPage';
import MemberLogin from './pages/MemberLogin';
import ResetPassword from './pages/ResetPassword';
import MemberVerification from './pages/MemberVerification';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import BlogsPage from './pages/BlogsPage';
import TermsPage from './pages/TermsPage';


function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path='/verification' element={<Verification />} />
        <Route path='/verify' element={<MemberVerification />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/terms" element={<TermsPage />} />

        
        {/* Guest Only Routes (Redirect if already logged in) */}
        <Route path="/register" element={
          <GuestRoute role="Member">
            <RegisterPage />
          </GuestRoute>
        } />
        <Route path="/executive-register" element={<ExecutiveRegisterPage />} />
        <Route path="/login" element={
          <GuestRoute role="Member">
            <MemberLogin />
          </GuestRoute>
        } />
        <Route path="/admin-login" element={
          <GuestRoute role="Admin">
            <AdminLogin />
          </GuestRoute>
        } />

        {/* Protected Member Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute role="Member">
            <MemberDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/donate" element={<Donate />} />
        
        {/* Protected Admin Routes */}
        <Route path="/admin-portal" element={
          <ProtectedRoute role="Admin">
            <AdminPortal />
          </ProtectedRoute>
        } />
      </Routes>
      <FloatingWhatsApp />
    </Router>
  )
}

export default App
