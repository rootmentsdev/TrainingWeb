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
            // Step 1: Verify employee credentials with timeout
            console.log('🔐 Starting employee verification...');
            const response = await lmswebAPI.verifyEmployee(credentials.employeeId, credentials.password);
            
            if (response.status === 'success' && response.data) {
                // Step 2: Get user MongoDB ID (with timeout and fallback)
                let userMongoId = null;
                const normalizedEmpId = credentials.employeeId.charAt(0).toUpperCase() + credentials.employeeId.slice(1).toLowerCase();
                
                try {
                    console.log('🔍 Fetching user MongoDB ID...');
                    const userResponse = await lmswebAPI.getUserByEmployeeId(normalizedEmpId);
                    if (userResponse && userResponse.data && userResponse.data._id) {
                        userMongoId = userResponse.data._id;
                        console.log('✅ Found user MongoDB ID:', userMongoId);
                    }
                } catch (userError) {
                    console.warn('⚠️ Could not fetch user MongoDB ID:', userError.message);
                    // Fallback for known users
                    if (normalizedEmpId === 'Emp257') {
                        userMongoId = '68b2ecf4c8ad2931fc91b8b6';
                        console.log('✅ Using fallback MongoDB ObjectId for Emp257:', userMongoId);
                    }
                }
                
                // Step 3: Create employee data
                const employeeData = {
                    _id: userMongoId || response.data.employeeId,
                    userId: userMongoId || response.data.employeeId,
                    id: userMongoId || response.data.employeeId,
                    employeeId: response.data.employeeId,
                    empID: normalizedEmpId,
                    name: response.data.name,
                    username: response.data.name,
                    role: response.data.role,
                    store: response.data.Store,
                    workingBranch: response.data.Store,
                    token: `emp-${response.data.employeeId}-${Date.now()}`,
                    hasMongoId: !!userMongoId
                };
                
                // Step 4: Store authentication data immediately
                localStorage.setItem('authToken', employeeData.token);
                localStorage.setItem('userData', JSON.stringify(employeeData));
                localStorage.setItem('empID', normalizedEmpId); // Store for TrainingDashboard
                
                console.log('✅ Login successful, user data stored');
                
                // Step 5: Call success callback immediately (don't wait for tracking)
                onLoginSuccess(employeeData);
                
                // Step 6: Track login asynchronously (non-blocking)
                trackLoginAsync(employeeData);
                
            } else {
                throw new Error('Employee verification failed. Please check your credentials.');
            }
        } catch (err) {
            console.error('Login error:', err);
            
            // Handle specific error types
            if (err.message && err.message.includes('timeout')) {
                setError('Login request timed out. Please check your internet connection and try again.');
            } else if (err.message && err.message.includes('401')) {
                setError('Invalid credentials. Please check your Employee ID and password.');
            } else if (err.message && err.message.includes('Network')) {
                setError('Network error. Please check your internet connection and try again.');
            } else {
                setError(err.message || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Non-blocking login tracking function
    const trackLoginAsync = async (employeeData) => {
        try {
            const trackingData = {
                userId: employeeData._id || employeeData.employeeId,
                username: employeeData.name,
                email: `${employeeData.employeeId}@company.com`,
                loginSource: 'LMS_WEBSITE',
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            };
            
            console.log('📊 Tracking login (async)...');
            
            // Use timeout for tracking call
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch('https://lms-testenv.onrender.com/api/lms-login/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2JjMDJlNjg2Mzk2ZGNhNWNkNmIwNjQiLCJ1c2VybmFtZSI6IlJldmF0aHkiLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NTcxNDg2MTR9.fXRyxFUXuTBF2loHFTusGDExS3Du8t_ZUFXa55fiG2w'
                },
                body: JSON.stringify(trackingData),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                console.log('✅ Login tracking successful');
            } else {
                console.log('❌ Tracking failed:', response.status);
            }
        } catch (trackingError) {
            console.warn('⚠️ Login tracking failed (non-blocking):', trackingError.message);
            // This doesn't affect the user experience
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

            </div>
        </div>
    );
};

export default Login;
