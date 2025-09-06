// API configuration for lmsweb frontend
// This connects to the same backend as the main LMS frontend

import { getBackendUrl, getExternalApiConfig, getCorsConfig, isDevelopment } from '../config/environment.js';

const API_CONFIG = {
    // Dynamic backend URL based on environment
    baseUrl: getBackendUrl(),
    // Local development backend
    localBackend: "http://localhost:7000/",
    // CORS configuration
    ...getCorsConfig(),
    // External API configuration
    externalApi: getExternalApiConfig(),
    endpoints: {
        // External employee verification
        verifyEmployee: "api/verify_employee",
        
        // User authentication
        login: "api/auth/login",
        logout: "api/auth/logout",
        register: "api/usercreate/create-user",
        
        // Training modules and management
        modules: "api/modules",
        createModule: "api/modules",
        getModules: "api/modules",
        
        // Training management
        trainings: "api/trainings",
        createTraining: "api/trainings",
        getTrainingById: "api/trainings",
        getAllUserTraining: "api/get/allusertraining",
        getFullAllUserTraining: "api/get/Full/allusertraining",
        
        // User training progress - REGULAR TRAININGS
        userTraining: "api/user/getAll/training",
        userTrainingProcess: "api/user/getAll/trainingprocess",
        userTrainingProcessModule: "api/user/getAll/trainingprocess/module",
        updateTrainingProcess: "api/user/update/trainingprocess",
        
        // MANDATORY TRAININGS - based on designation
        mandatoryTrainings: "api/get/mandatory/allusertraining",
        
        // Training assignment and reassignment
        assignModuleToUser: "api/user/assign-module",
        assignAssessmentToUser: "api/user/assign-assessment",
        reassignTraining: "api/user/reassign/training",
        getTrainingDetails: "api/user/get/Training/details/simple",
        
        // Assessments
        assessments: "api/assessments",
        createAssessment: "api/assessments",
        getAssessments: "api/assessments",
        userAssessment: "api/user/assessment/user/get/assessment",
        createUserAssessment: "api/user/post/createAssessment",
        
        // Progress calculation
        calculateProgress: "api/get/progress",
        
        // Employee data
        employeeDetail: "api/employee_detail",
        employeeRange: "api/employee_range",
        employee: "api/employee",
        
        // User management
        createUser: "api/usercreate/create-user",
        getAllUsers: "api/usercreate/getAll/users",
        getUserByEmployeeId: "api/user/get/user/details",
        getBranch: "api/usercreate/getAll/branch",
        getDesignation: "api/usercreate/getAll/designation",
        
        // Admin routes
        adminLogin: "api/admin/admin/login",
        adminVerifyToken: "api/admin/admin/verifyToken",
        getBestUsers: "api/admin/get/bestThreeUser",
        getVisibility: "api/admin/get/setting/visibility",
        
        // User login tracking
        trackLogin: "api/user-login/track-login",
        trackLogout: "api/user-login/track-logout",
        getLoginAnalytics: "api/user-login/analytics",
        getUserLoginHistory: "api/user-login/user-history",
        getActiveUsers: "api/user-login/active-users",
        getDashboardStats: "api/user-login/dashboard-stats",
        getPublicStats: "api/user-login/public-stats",
        
        // LMS Website login tracking - use correct endpoint
        trackLmsLogin: "api/lms-login/track"
    }
};

// Helper function to make API calls to your backend
export const apiCall = async (endpoint, options = {}) => {
    // Check if local backend is available (for development)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const useCorsProxy = isDevelopment && window.location.hostname === 'localhost';
    
    let url;
    
    // Check if we should force local backend usage
    if (API_CONFIG.forceLocalBackend && (isDevelopment || window.location.hostname === 'localhost')) {
        // Use local backend (only when running locally)
        url = `${API_CONFIG.localBackend}${endpoint}`;
        console.log('🌐 Using local backend:', url);
    } else {
        // Use production backend
        url = `${API_CONFIG.baseUrl}${endpoint}`;
        console.log('🌐 Using production backend:', url);
    }
    
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: isDevelopment && window.location.hostname === 'localhost' ? 'omit' : 'include', // Don't include credentials for local development
        ...options
    };

    try {
        console.log(`🌐 Making API call to: ${url}`);
        const response = await fetch(url, defaultOptions);
        
        if (!response.ok) {
            // If local backend fails, try production backend as fallback
            if (isDevelopment && url.includes('localhost:7000')) {
                console.log('⚠️ Local backend failed, trying production backend...');
                const fallbackUrl = `${API_CONFIG.baseUrl}${endpoint}`;
                const fallbackResponse = await fetch(fallbackUrl, defaultOptions);
                
                if (!fallbackResponse.ok) {
                    throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
                }
                
                console.log('✅ Production backend fallback successful');
                return await fallbackResponse.json();
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        
        // If local backend failed or CORS blocked, try production with CORS proxy
        if ((url.includes('localhost:7000') || error.message.includes('CORS')) && !url.includes(API_CONFIG.corsProxy)) {
            console.log('🔄 Trying production backend with CORS proxy...');
            try {
                const corsProxyUrl = `${API_CONFIG.corsProxy}${API_CONFIG.baseUrl}${endpoint}`;
                const corsProxyOptions = {
                    ...defaultOptions,
                    headers: {
                        ...defaultOptions.headers,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                };
                const corsResponse = await fetch(corsProxyUrl, corsProxyOptions);
                
                if (!corsResponse.ok) {
                    throw new Error(`CORS proxy failed: ${corsResponse.status}`);
                }
                
                console.log('✅ CORS proxy successful');
                return await corsResponse.json();
            } catch (corsError) {
                console.error('CORS proxy also failed:', corsError);
                throw error; // Throw original error
            }
        }
        
        throw error;
    }
};

// Helper function to make API calls to external API (rootments.in)
export const externalApiCall = async (endpoint, options = {}) => {
    const url = `${API_CONFIG.externalApi.baseUrl}${endpoint}`;
    
    // First, try to get a CSRF token if this is a web route
    let csrfToken = '';
    try {
        console.log('🔄 Attempting to get CSRF token...');
        const csrfResponse = await fetch(`${API_CONFIG.externalApi.baseUrl}sanctum/csrf-cookie`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (csrfResponse.ok) {
            // Extract CSRF token from cookies
            const cookies = document.cookie.split(';');
            const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
            if (csrfCookie) {
                csrfToken = decodeURIComponent(csrfCookie.split('=')[1]);
                console.log('✅ CSRF token obtained:', csrfToken.substring(0, 20) + '...');
            }
        }
    } catch (error) {
        console.warn('⚠️ Could not get CSRF token:', error.message);
    }
    
    // Try different authentication methods for Laravel
    const authMethods = [
        // Method 1: CSRF token with session (for web routes)
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'include'
        },
        // Method 2: Bearer token with API headers
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.externalApi.token}`,
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'omit'
        },
        // Method 3: Bearer token without X-Requested-With
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.externalApi.token}`,
            },
            credentials: 'omit'
        },
        // Method 4: API key in header (alternative format)
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': API_CONFIG.externalApi.token,
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'omit'
        },
        // Method 5: Simple POST without special headers (for CORS testing)
        {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'omit'
        }
    ];

    let lastError = null;

    for (let i = 0; i < authMethods.length; i++) {
        const method = authMethods[i];
        const defaultOptions = {
            method: 'GET',
            ...method,
            ...options
        };

        try {
            console.log(`🌐 Making external API call to: ${url} (Method ${i + 1})`);
            if (method.headers['X-CSRF-TOKEN']) {
                console.log('🔑 Using auth method: CSRF Token + Session');
            } else if (method.headers.Authorization) {
                console.log('🔑 Using auth method: Bearer Token');
            } else if (method.headers['X-API-Key']) {
                console.log('🔑 Using auth method: API Key');
            } else {
                console.log('🔑 Using auth method: No Auth');
            }
            
            const response = await fetch(url, defaultOptions);
            
            if (!response.ok) {
                if (response.status === 419) {
                    console.warn(`⚠️ Method ${i + 1} failed with 419 (CSRF/session issue)`);
                    lastError = new Error(`Method ${i + 1} failed: CSRF token mismatch or session expired`);
                    continue; // Try next method
                }
                if (response.status === 401) {
                    console.warn(`⚠️ Method ${i + 1} failed with 401 (unauthorized)`);
                    lastError = new Error(`Method ${i + 1} failed: Invalid or expired API token`);
                    continue; // Try next method
                }
                if (response.status === 403) {
                    console.warn(`⚠️ Method ${i + 1} failed with 403 (forbidden)`);
                    lastError = new Error(`Method ${i + 1} failed: Access denied`);
                    continue; // Try next method
                }
                
                // If it's not an auth error, throw immediately
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ External API call successful with Method ${i + 1}:`, data);
            return data;
            
        } catch (error) {
            console.warn(`⚠️ Method ${i + 1} failed:`, error.message);
            lastError = error;
            
            // If it's not an auth error, don't try other methods
            if (!error.message.includes('CSRF') && !error.message.includes('401') && !error.message.includes('403')) {
                break;
            }
        }
    }
    
    // All methods failed
    console.error('❌ All authentication methods failed');
    throw lastError || new Error('All authentication methods failed');
};

// Specific API functions for lmsweb
export const lmswebAPI = {
    // ===== EXTERNAL EMPLOYEE VERIFICATION =====
    verifyEmployee: (employeeId, password) => {
        console.log('🔐 Attempting employee verification for:', employeeId);
        console.log('📡 Using backend proxy endpoint: api/verify_employee');
        
        // Use backend proxy instead of direct external API call to avoid CORS issues
        return apiCall(API_CONFIG.endpoints.verifyEmployee, {
            method: 'POST',
            body: JSON.stringify({ employeeId, password })
        });
    },
    
    // ===== USER AUTHENTICATION =====
    login: (credentials) => apiCall(API_CONFIG.endpoints.login, {
        method: 'POST',
        body: JSON.stringify(credentials)
    }),
    
    logout: (sessionId) => apiCall(API_CONFIG.endpoints.logout, { 
        method: 'POST',
        body: JSON.stringify({ sessionId })
    }),
    
    register: (userData) => apiCall(API_CONFIG.endpoints.register, {
        method: 'POST',
        body: JSON.stringify(userData)
    }),
    
    // ===== TRAINING MANAGEMENT =====
    // Get all trainings for admin view
    getAllTrainings: () => apiCall(API_CONFIG.endpoints.getAllUserTraining),
    
    // Get full training data with completion status
    getFullAllTrainings: () => apiCall(API_CONFIG.endpoints.getFullAllUserTraining),
    
    // Get specific training by ID
    getTrainingById: (trainingId) => apiCall(`${API_CONFIG.endpoints.getTrainingById}/${trainingId}`),
    
    // Create new training
    createTraining: (trainingData) => apiCall(API_CONFIG.endpoints.createTraining, {
        method: 'POST',
        body: JSON.stringify(trainingData)
    }),
    
    // ===== USER TRAINING PROGRESS =====
    // Unified API - Get all trainings (assigned and mandatory) for a user
    getUserAllTrainings: (empID) => apiCall(`api/user/getAll/trainings?empID=${empID}`),
    
    // Get user's REGULAR assigned trainings (based on empID) - DEPRECATED: Use getUserAllTrainings instead
    getUserTraining: (empID) => apiCall(`${API_CONFIG.endpoints.userTraining}?empID=${empID}`),
    
    // Get user's MANDATORY trainings (based on designation/role)
    getUserMandatoryTraining: (empID, userRole) => {
        const url = userRole 
            ? `${API_CONFIG.endpoints.mandatoryTrainings}?empID=${empID}&userRole=${encodeURIComponent(userRole)}`
            : `${API_CONFIG.endpoints.mandatoryTrainings}?empID=${empID}`;
        return apiCall(url);
    },
    
    // Get detailed training process for specific user and training
    getUserTrainingProcess: (userId, trainingId) => apiCall(
        `${API_CONFIG.endpoints.userTrainingProcess}?userId=${userId}&trainingId=${trainingId}`
    ),
    
    // Get specific module in training process
    getUserTrainingProcessModule: (userId, trainingId, moduleId) => apiCall(
        `${API_CONFIG.endpoints.userTrainingProcessModule}?userId=${userId}&trainingId=${trainingId}&moduleId=${moduleId}`
    ),
    
    // Update training progress (mark video as completed)
    updateTrainingProcess: (userId, trainingId, moduleId, videoId) => apiCall(
        `${API_CONFIG.endpoints.updateTrainingProcess}?userId=${userId}&trainingId=${trainingId}&moduleId=${moduleId}&videoId=${videoId}`,
        { method: 'PATCH' }
    ),

    // Submit video assessment answers
    submitVideoAssessment: (assessmentData) => apiCall(
        'api/user/submit/video-assessment',
        {
            method: 'POST',
            body: JSON.stringify(assessmentData)
        }
    ),

    // Get video assessment questions
    getVideoAssessment: (videoId) => apiCall(
        `api/user/get/video-assessment/${videoId}`
    ),

    // Submit video assessment answers
    submitVideoAssessmentAnswers: (videoId, answers) => apiCall(
        `api/user/submit/video-assessment/${videoId}`,
        {
            method: 'POST',
            body: JSON.stringify({ answers })
        }
    ),

    // Create training progress record
    createTrainingProgress: (progressData) => apiCall(
        'api/user/create/trainingprogress',
        {
            method: 'POST',
            body: JSON.stringify(progressData)
        }
    ),

    // Track video watch progress
    trackVideoProgress: (userId, trainingId, moduleId, videoId, watchTime, totalDuration, watchPercentage) => apiCall(
        'video_progress',
        {
            method: 'POST',
            body: JSON.stringify({
                userId,
                trainingId,
                moduleId,
                videoId,
                watchTime,
                totalDuration,
                watchPercentage
            })
        }
    ),
    
    // ===== TRAINING ASSIGNMENT =====
    // Assign module to user
    assignModuleToUser: (assignmentData) => apiCall(API_CONFIG.endpoints.assignModuleToUser, {
        method: 'POST',
        body: JSON.stringify(assignmentData)
    }),
    
    // Assign assessment to user
    assignAssessmentToUser: (assignmentData) => apiCall(API_CONFIG.endpoints.assignAssessmentToUser, {
        method: 'POST',
        body: JSON.stringify(assignmentData)
    }),
    
    // Reassign training to users
    reassignTraining: (reassignmentData) => apiCall(API_CONFIG.endpoints.reassignTraining, {
        method: 'POST',
        body: JSON.stringify(reassignmentData)
    }),
    
    // Get training details with user progress
    getTrainingDetails: (trainingId, userId) => {
        const url = userId 
            ? `${API_CONFIG.endpoints.getTrainingDetails}/${trainingId}?userId=${userId}`
            : `${API_CONFIG.endpoints.getTrainingDetails}/${trainingId}`;
        return apiCall(url);
    },
    
    // Mark video as complete
    markVideoAsComplete: (videoId, trainingId, moduleId, userId, watchTime, totalDuration) => apiCall(API_CONFIG.endpoints.updateTrainingProcess, {
        method: 'PATCH',
        body: JSON.stringify({ 
            videoId, 
            trainingId, 
            moduleId, 
            userId,
            watchTime: watchTime || 0,
            totalDuration: totalDuration || 0
        })
    }),
    
    // ===== MODULE MANAGEMENT =====
    // Get all modules
    getModules: (moduleId) => moduleId 
        ? apiCall(`${API_CONFIG.endpoints.getModules}/${moduleId}`)
        : apiCall(API_CONFIG.endpoints.getModules),
    
    // Create new module
    createModule: (moduleData) => apiCall(API_CONFIG.endpoints.createModule, {
        method: 'POST',
        body: JSON.stringify(moduleData)
    }),
    
    // ===== ASSESSMENT MANAGEMENT =====
    // Get all assessments
    getAssessments: (assessmentId) => assessmentId 
        ? apiCall(`${API_CONFIG.endpoints.getAssessments}/${assessmentId}`)
        : apiCall(API_CONFIG.endpoints.getAssessments),
    
    // Create new assessment
    createAssessment: (assessmentData) => apiCall(API_CONFIG.endpoints.createAssessment, {
        method: 'POST',
        body: JSON.stringify(assessmentData)
    }),
    
    // Get user assessments
    getUserAssessments: (userId) => apiCall(
        `${API_CONFIG.endpoints.userAssessment}?userId=${userId}`
    ),
    
    // Create or assign user assessment
    createUserAssessment: (assessmentData) => apiCall(API_CONFIG.endpoints.createUserAssessment, {
        method: 'POST',
        body: JSON.stringify(assessmentData)
    }),
    
    // ===== PROGRESS CALCULATION =====
    // Calculate training progress
    calculateProgress: (userId) => apiCall(
        `${API_CONFIG.endpoints.calculateProgress}?userId=${userId}`
    ),
    
    // ===== EMPLOYEE DATA =====
    // Get employee details
    getEmployeeDetail: (empId) => apiCall(API_CONFIG.endpoints.employeeDetail, {
        method: 'POST',
        body: JSON.stringify({ empId })
    }),
    
    // Get employee range
    getEmployeeRange: (startEmpId, endEmpId) => apiCall(API_CONFIG.endpoints.employeeRange, {
        method: 'POST',
        body: JSON.stringify({ startEmpId, endEmpId })
    }),
    
    // ===== USER MANAGEMENT =====
    // Get all users
    getAllUsers: () => apiCall(API_CONFIG.endpoints.getAllUsers),
    
    // Get all branches
    getBranches: () => apiCall(API_CONFIG.endpoints.getBranch),
    
    // Get all designations
    getDesignations: () => apiCall(API_CONFIG.endpoints.getDesignation),
    
    // ===== ADMIN FUNCTIONS =====
    // Admin login
    adminLogin: (adminData) => apiCall(API_CONFIG.endpoints.adminLogin, {
        method: 'POST',
        body: JSON.stringify(adminData)
    }),
    
    // Verify admin token
    verifyAdminToken: (token) => apiCall(API_CONFIG.endpoints.adminVerifyToken, {
        method: 'POST',
        body: JSON.stringify({ token })
    }),
    
    // Get best users
    getBestUsers: () => apiCall(API_CONFIG.endpoints.getBestUsers),
    
    // Get visibility settings
    getVisibility: () => apiCall(API_CONFIG.endpoints.getVisibility),
    
    // ===== LOGIN TRACKING =====
    // Track user login
    trackLogin: (loginData) => apiCall(API_CONFIG.endpoints.trackLogin, {
        method: 'POST',
        body: JSON.stringify(loginData)
    }),
    
    // Track user logout
    trackLogout: (logoutData) => apiCall(API_CONFIG.endpoints.trackLogout, {
        method: 'POST',
        body: JSON.stringify(logoutData)
    }),
    
    // Get login analytics
    getLoginAnalytics: (period, groupBy) => apiCall(
        `${API_CONFIG.endpoints.getLoginAnalytics}?period=${period}&groupBy=${groupBy}`
    ),
    
    // Get user login history
    getUserLoginHistory: (userId) => apiCall(
        `${API_CONFIG.endpoints.getUserLoginHistory}?userId=${userId}`
    ),
    
    // Get active users
    getActiveUsers: () => apiCall(API_CONFIG.endpoints.getActiveUsers),
    
    // Get dashboard stats
    getDashboardStats: () => apiCall(API_CONFIG.endpoints.getDashboardStats),
    
    // Get public stats
    getPublicStats: () => apiCall(API_CONFIG.endpoints.getPublicStats),
    
    // ===== LMS WEBSITE LOGIN TRACKING =====
    // Track LMS website login
    trackLmsLogin: (loginData) => apiCall(API_CONFIG.endpoints.trackLmsLogin, {
        method: 'POST',
        body: JSON.stringify(loginData)
    }),
    
    // ===== TRAINING PROCESS DETAILS =====
    // Get detailed training process with modules and videos
    getTrainingProcess: (userId, trainingId) => apiCall(
        `${API_CONFIG.endpoints.userTrainingProcess}?userId=${userId}&trainingId=${trainingId}`
    ),
    
    // ===== USER MANAGEMENT =====
    // Get user by employee ID
    getUserByEmployeeId: (empId) => apiCall(
        `${API_CONFIG.endpoints.getUserByEmployeeId}?empID=${empId}`
    )
};

export default API_CONFIG;

