import React, { useState, useEffect } from 'react'
import Login from './components/Login'
import TrainingDashboard from './components/TrainingDashboard'
import { lmswebAPI } from './api/api.js'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        // Invalid user data, clear storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    // Track logout if user data is available
    if (user) {
      try {
        const logoutData = {
          userId: user._id || user.employeeId,
          username: user.name,
          logoutSource: 'LMS_WEBSITE',
          timestamp: new Date().toISOString()
        };
        
        console.log('📊 Tracking LMS website logout:', logoutData);
        await lmswebAPI.trackLogout(logoutData);
        console.log('✅ LMS logout tracking successful');
      } catch (trackingError) {
        console.warn('⚠️ LMS logout tracking failed (non-blocking):', trackingError.message);
        // Don't block logout if tracking fails
      }
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>LMS Web Training Portal</h1>
          {user && (
            <div className="user-menu">
              <div className="user-details">
                <span className="user-name">Welcome, {user.name}</span>
                <span className="user-role">{user.role}</span>
                <span className="user-store">{user.store}</span>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      
      <TrainingDashboard />
    </div>
  )
}

export default App
