import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MobileLanding from './pages/MobileLanding';
import MobileForm from './pages/MobileForm';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProjectDetails from './pages/ProjectDetails';

import AdminSignup from './pages/AdminSignup';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect Root to Admin Login */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* Mobile Routes (Optional/Legacy - kept if needed via direct link) */}
        <Route path="/mobile-landing" element={<MobileLanding />} />
        <Route path="/form" element={<MobileForm />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/project/:id"
          element={
            <ProtectedRoute>
              <ProjectDetails />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
