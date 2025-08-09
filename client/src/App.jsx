import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import StudyMode from './components/StudyMode';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import PWAInstallButton from './components/PWAInstallButton';
import OfflineIndicator from './components/OfflineIndicator';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StudyProvider } from './contexts/StudyContext';
import LoadingSpinner from './components/LoadingSpinner';
import { registerSW } from './utils/pwa';

// プライベートルート用のコンポーネント
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? children : <Navigate to="/login" />;
};

// 管理者専用ルート用のコンポーネント
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user && user.role === 'admin' ? children : <Navigate to="/dashboard" />;
};

function AppContent() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Service Workerを登録
    registerSW();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/study" 
          element={
            <PrivateRoute>
              <StudyMode />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/login"} />} 
        />
      </Routes>
      
      {/* PWA関連コンポーネント */}
      <PWAInstallButton />
      <OfflineIndicator />
      
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: '#333',
            fontWeight: '500'
          }
        }}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <StudyProvider>
          <AppContent />
        </StudyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;