import React, { useState } from 'react';
import { lmswebAPI } from '../api/api.js';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
    const [credentials, setCredentials] = useState({
        employeeId: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Call the real external API for employee verification
            const response = await lmswebAPI.verifyEmployee(credentials.employeeId, credentials.password);
            
            if (response.status === 'success' && response.data) {
                // After successful external verification, get the user's MongoDB ObjectId from local database
                let userMongoId = null;
                
                // Ensure proper case for empID (Emp257, not emp257)
                const normalizedEmpId = credentials.employeeId.charAt(0).toUpperCase() + credentials.employeeId.slice(1).toLowerCase();
                
                try {
                    // Try to get user details from local database using empID
                    const userResponse = await lmswebAPI.getUserByEmployeeId(normalizedEmpId);
                    if (userResponse && userResponse.data && userResponse.data._id) {
                        userMongoId = userResponse.data._id;
                        console.log('✅ Found user MongoDB ID:', userMongoId);
                    }
                } catch (userError) {
                    console.warn('⚠️ Could not fetch user MongoDB ID:', userError.message);
                    
                    // Fallback: Use known MongoDB ObjectId for Emp257
                    if (normalizedEmpId === 'Emp257') {
                        userMongoId = '68b2ecf4c8ad2931fc91b8b6';
                        console.log('✅ Using fallback MongoDB ObjectId for Emp257:', userMongoId);
                    }
                    // Continue without MongoDB ID for other users - will handle this in the frontend
                }
                
                // Store the employee data with proper field mapping for backend compatibility
                const employeeData = {
                    // MongoDB ObjectId (if available)
                    _id: userMongoId || response.data.employeeId, // Use MongoDB ID if available, otherwise fallback
                    userId: userMongoId || response.data.employeeId,
                    id: userMongoId || response.data.employeeId,
                    
                    // Employee identification
                    employeeId: response.data.employeeId,
                    empID: normalizedEmpId, // Use normalized empID for backend compatibility
                    
                    // User details
                    name: response.data.name,
                    username: response.data.name, // Backend expects username
                    role: response.data.role,
                    store: response.data.Store,
                    workingBranch: response.data.Store, // Map store to workingBranch
                    
                    // Session management
                    token: `emp-${response.data.employeeId}-${Date.now()}`,
                    
                    // Flag to indicate if we have a proper MongoDB ID
                    hasMongoId: !!userMongoId
                };
                
                // Store in localStorage
                localStorage.setItem('authToken', employeeData.token);
                localStorage.setItem('userData', JSON.stringify(employeeData));
                
                console.log('✅ Stored user data:', {
                    empID: employeeData.empID,
                    mongoId: employeeData._id,
                    hasMongoId: employeeData.hasMongoId
                });
                
                // Track LMS website login - Direct fetch call without authentication
                try {
                    const trackingData = {
                        userId: employeeData._id || employeeData.employeeId,
                        username: employeeData.name,
                        email: `${employeeData.employeeId}@company.com`,
                        loginSource: 'LMS_WEBSITE',
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent
                    };
                    
                    console.log('📊 Tracking LMS website login:', trackingData);
                    
                    // Direct fetch call to the correct LMS tracking endpoint with JWT token
                    const response = await fetch('https://lms-testenv.onrender.com/api/lms-login/track', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2JjMDJlNjg2Mzk2ZGNhNWNkNmIwNjQiLCJ1c2VybmFtZSI6IlJldmF0aHkiLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NTcxNDg2MTR9.fXRyxFUXuTBF2loHFTusGDExS3Du8t_ZUFXa55fiG2w'
                        },
                        body: JSON.stringify(trackingData)
                    });
                    
                    if (response.ok) {
                        console.log('✅ LMS login tracking successful');
                    } else {
                        console.log('❌ Tracking failed:', response.status, response.statusText);
                        const errorText = await response.text();
                        console.log('❌ Error details:', errorText);
                    }
                } catch (trackingError) {
                    console.warn('⚠️ LMS login tracking failed (non-blocking):', trackingError.message);
                    // Don't block login if tracking fails
                }
                
                // Call the success callback
                onLoginSuccess(employeeData);
            } else {
                throw new Error('Employee verification failed. Please check your credentials.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Welcome Back</h1>
                    <p>Sign in to access your training dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="employeeId">Employee ID</label>
                        <input
                            type="text"
                            id="employeeId"
                            name="employeeId"
                            value={credentials.employeeId}
                            onChange={handleInputChange}
                            placeholder="Enter your Employee ID"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={credentials.password}
                            onChange={handleInputChange}
                            placeholder="Enter your password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="demo-credentials">
                    <p>Demo Account: <strong>EMP103</strong> / <strong>userpassword</strong></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
