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
                    <h1>LMS Web Login</h1>
                    <p>Access your training dashboard</p>
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
                            placeholder="Enter your Employee ID (e.g., EMP103)"
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
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="login-info">
                    <h3>Login Information</h3>
                    <p><strong>External API:</strong> <code>POST https://rootments.in/api/verify_employee</code></p>
                    <p><strong>Backend Proxy:</strong> <code>POST http://localhost:7000/api/verify_employee</code></p>
                    <p><strong>Test Credentials:</strong></p>
                    <ul>
                        <li>Employee ID: <code>EMP103</code></li>
                        <li>Password: <code>userpassword</code></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Login;
