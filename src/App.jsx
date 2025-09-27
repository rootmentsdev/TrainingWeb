import React, { useState, useEffect } from 'react'
import Login from './components/Login'
import TrainingDashboard from './components/TrainingDashboard'
import { lmswebAPI } from './api/api.js'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        const empID = localStorage.getItem('empID');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          
          // Validate that we have essential user data
          if (parsedUser.employeeId && parsedUser.name) {
            console.log('✅ Valid authentication found, restoring session');
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            console.warn('⚠️ Invalid user data found, clearing storage');
            clearAuthStorage();
          }
        } else {
          console.log('ℹ️ No authentication found');
          clearAuthStorage();
        }
      } catch (error) {
        console.error('❌ Error checking auth status:', error);
        clearAuthStorage();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    const clearAuthStorage = () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('empID');
      setUser(null);
      setIsAuthenticated(false);
    };

    checkAuthStatus();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    // Track logout if user data is available (non-blocking)
    if (user) {
      try {
        const logoutData = {
          userId: user._id || user.employeeId,
          username: user.name,
          logoutSource: 'LMS_WEBSITE',
          timestamp: new Date().toISOString()
        };
        
        console.log('📊 Tracking logout (async)...');
        lmswebAPI.trackLogout(logoutData).then(() => {
          console.log('✅ Logout tracking successful');
        }).catch((trackingError) => {
          console.warn('⚠️ Logout tracking failed (non-blocking):', trackingError.message);
        });
      } catch (error) {
        console.warn('⚠️ Error preparing logout tracking:', error.message);
      }
    }
    
    // Clear authentication immediately
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('empID');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

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
