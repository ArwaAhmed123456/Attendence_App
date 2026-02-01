import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MobileLanding from './pages/MobileLanding';
import MobileForm from './pages/MobileForm';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProjectDetails from './pages/ProjectDetails';

import AdminSignup from './pages/AdminSignup';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Mobile / Worker Routes */}
        <Route path="/" element={<MobileLanding />} />
        <Route path="/form" element={<MobileForm />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/project/:id" element={<ProjectDetails />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
