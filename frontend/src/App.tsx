import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/Landing';
import { FeaturesPage } from './pages/Features';
import { DashboardPage } from './pages/Dashboard';
import { LoginPage } from './pages/Login';
import { ContactPage } from './pages/Contact';

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/contact" element={<ContactPage />} />
        </Routes>
    );
};

export default App;
